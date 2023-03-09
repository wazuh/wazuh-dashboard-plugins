import json
import uuid
import splunk_instrumentation.constants as constants
from splunk_instrumentation.service_bundle import ServiceBundle
import splunk_instrumentation.splunklib as splunklib
from splunk_instrumentation.splunklib.data import Record


class DeploymentIdManager(object):
    '''
    Manages the initialization and retrieval of the deployment ID.

    Historical Note: The deployment ID was originally stored in the KV
    store. This approach was abandoned due to stability and availability
    concerns of the KV store. This class handles detecting existing
    deployment ID settings in the KV store and migrates it to telemetry.conf.
    The conf file approach should be more reliable than the KV store (since
    conf files are available on all splunk product types, cannot be disabled
    by the user, and do not rely on an external mongo process).
    '''

    # Randomly generated namespace to use when generating uuids
    instrumentationUuidNamespace = uuid.UUID('6622c08d-93f1-4af0-bb9a-c58580975285')

    # The deployment ID for this splunk deployment
    deployment_id = None

    def __init__(self,
                 splunkd,
                 services=None,
                 telemetry_conf_service=None,
                 server_info_service=None):

        self.services = services or ServiceBundle(
            splunkd,
            telemetry_conf_service=telemetry_conf_service,
            server_info_service=server_info_service)

        self.splunkd = self.services.splunkd
        self.telemetry_conf_service = self.services.telemetry_conf_service
        self.server_info_service = self.services.server_info_service
        self._kv_store_deployment_id = None
        self._prefix = None

    def get_deployment_id(self, no_create=False):
        """
        Gets the deployment ID for this splunk instance.

        If no deployment ID is known yet, the behavior depends
        on the TelemetryConfService used to instantiate this object.
         - If the TelemetryConfService is read only, `None` is returned.
         - If the TelemetryConfService is writable, any deployment ID in
           the KV store is migrated to the conf file, or a new one is
           generated and written to the conf file.
        """

        if self.deployment_id is not None:
            return self.deployment_id

        self.deployment_id = self.telemetry_conf_service.content.get('deploymentID')
        deployment_id_is_in_conf_file = self.deployment_id is not None

        can_write_conf_file = not self.telemetry_conf_service.is_read_only

        # Check the KV store for an existing ID
        if not self.deployment_id and self.kv_store_is_available():
            if self.has_deployment_id_in_kv_store():
                self.deployment_id = self.kv_store_deployment_id

        # We can't write to the conf file, so we don't want to generate a new
        # deployment ID either. (Since we can't persist it, it would be a one-time-
        # only deployment ID.) Instead, we'll just return what we have, which will
        # be either `None`, or the deployment ID from the KV store.
        if not can_write_conf_file or no_create:
            # May still be `None`!
            return self.deployment_id

        # Create ID on demand if none yet exists
        if self.deployment_id is None:
            self.generate_new_deployment_id()

        if not deployment_id_is_in_conf_file and can_write_conf_file:
            self.write_deployment_id_to_conf_file()

        return self.deployment_id

    def sync_deployment_id(self):
        '''
        Get deployment id from cluster master
        '''

        # If we can't persist the value to the conf file,
        # let's not bother trying to fetch it from the cluster master[s],
        # or else we'll end up going back to the cluster master every time
        # we need to look it up. Considering that this lookup may happen
        # more than once per page load, the performance impact could be
        # significant.
        if self.telemetry_conf_service.is_read_only:
            return

        try:
            resp = self.splunkd.request(
                constants.ENDPOINTS['MASTER_SETTINGS'],
                method='GET',
                owner='nobody',
                app=constants.INST_APP_NAME)
            data = splunklib.data.load(resp.get('body').read())
            entry = data['feed'].get('entry')
            if entry:
                if type(entry) is list:
                    deploymentList = [value['content'].get('deploymentID') for value in entry]
                    if deploymentList:
                        deploymentList.sort()
                        self.deployment_id = deploymentList[0]
                elif type(entry) is Record:
                    self.deployment_id = entry['content'].get('deploymentID')

            if self.deployment_id:
                self.write_deployment_id_to_conf_file()
        except Exception:
            # Cluster master sync is best-effort only
            pass

    def generate_new_deployment_id(self):
        '''
        Generates a new deployment id and saves it to self.deployment_id
        '''
        prefix = self.get_deployment_id_prefix()
        self.deployment_id = str(uuid.uuid5(self.instrumentationUuidNamespace,
                                            self.server_info_service.content.get('master_guid')))
        if prefix:
            self.deployment_id = prefix + '-' + self.deployment_id

    def get_deployment_id_prefix(self):
        '''
        Determines the correct deployment ID prefix for this deployment.
        '''
        if self._prefix:
            return self._prefix

        prefix = None
        if self.server_info_service.is_cloud():
            prefix = 'CLOUD'
            if self.server_info_service.is_lite():
                prefix += 'LIGHT'

        self._prefix = prefix
        return self._prefix

    def kv_store_is_available(self):
        '''
        Returns true if the kv store status is reported as "ready"
        '''
        return self.server_info_service.content.get('kvStoreStatus') == 'ready'

    def has_deployment_id_in_kv_store(self):
        '''
        Returns True if the KV store has an entry for the deployment ID.
        '''
        return self.kv_store_deployment_id is not None

    def set_deployment_id(self, deployment_id):
        '''
        Explicitly sets the deployment ID.
        '''
        self.deployment_id = deployment_id
        self.write_deployment_id_to_conf_file()

    def write_deployment_id_to_conf_file(self):
        '''
        Writes self.deployment_id to the telemetry conf file.
        '''
        self.telemetry_conf_service.update({
            'deploymentID': self.deployment_id
        })
        self.telemetry_conf_service.fetch()
        self.deployment_id = self.telemetry_conf_service.content.get('deploymentID')

    @property
    def kv_store_deployment_id(self):
        '''
        Returns the KV store
        '''
        try:
            if not self._kv_store_deployment_id:
                resp = self.splunkd.get(
                    constants.ENDPOINTS['KV_STORE']['DEPLOYMENT_ID'],
                    owner=constants.INST_KV_OWNER,
                    app=constants.INST_APP_NAME)
                field_descriptor = json.loads(resp['body'].read())
                self._kv_store_deployment_id = field_descriptor['value']

            return self._kv_store_deployment_id
        except Exception:
            return None
