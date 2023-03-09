'''
Synopsis:

  splunk cmd python on_splunk_start.py

Usage:

  Called on splunk start. Not intended to be called manually, except for testing.

"Managed" Variable Sync Strategy:

  Managed variables like the deployment ID have complex lifecycles, and
  require synchronization among multiple nodes in a splunk deployment.
  This leads to their abstraction behind "manager" class interfaces.

  The strategy for syncing them is as follows:

  * On Splunk start (when this script is triggered):
  ** Pull (or "sync") whatever value is at the cluster master,
     overwriting any local value.
  *** Since configuring clustering often requires a splunk restart,
      this provides immediate sync up when clustering is enabled.
  ** Call the getter for the managed value.
  *** The getters are designed to generate a new value
      if one does not yet exist (perhaps this is a new installation,
      and there was no cluster master to read from).

  * On read (when the value is required to perform a task, or to create an event)
  ** Only call the getter.
  ** Typically, it is looked up in the conf file, and created anew if needed.
  ** Special handling may apply, see the corresponding manager class.
  ** If a new value is created, it *must* be passed to the telemetry endpoint
     to be persisted. Only this endpoint ensures replication to the cluster master.

  * On nightly scripted input
  ** Again, the value is pulled from the cluster master if possible
  ** This ensures liveness in the system, such that disagreements about
     these values can eventually be resolved by conforming to the choice
     of a single node. Basically, each night, the last search head to
     replicate a choice to the cluster master the prior day will have won,
     and all search heads will agree.
  ** In case there is no cluster master, it's usally a single instance,
     or the existing conf file replication is relied upon for syncing
     the managed values.
'''

import sys
import time
import logging

from splunk_instrumentation.splunkd import Splunkd
from splunk_instrumentation.service_bundle import ServiceBundle
from splunk_instrumentation.deployment_id_manager import DeploymentIdManager
import splunk_instrumentation.constants as constants
from splunk_instrumentation.salt_manager import SaltManager

NAME = "InstrumentationInit"

logger = logging.getLogger(NAME)


class OnSplunkStart(object):

    @staticmethod
    def wait_for_kv_store_started(services):
        '''
        Migration of the deployment ID from V1 of instrumentation
        requires waiting until the KV store is ready. We'll give
        it 5 minutes, then proceed without out.
        '''

        t_start = time.time()
        status = services.server_info_service.content.get('kvStoreStatus')

        while status == 'starting' and (time.time() - t_start) < (5 * 60):
            time.sleep(10)
            services.server_info_service.fetch()
            status = services.server_info_service.content.get('kvStoreStatus')

    @staticmethod
    def initialize_salt(salt_manager):
        '''
        Create a new telemetry salt for this deployment, if needed.
        '''
        salt_manager.sync_with_cluster()
        salt_manager.get_salt()

    @staticmethod
    def initialize_deployment_id(services, deployment_id_manager):
        '''
        Creates a new deployment ID for this deployment, if needed.
        '''

        deployment_id_manager.sync_deployment_id()
        deployment_id = deployment_id_manager.get_deployment_id()
        prefix = deployment_id_manager.get_deployment_id_prefix()

        # Ensure the correct prefix is set given the current product type
        if prefix and not deployment_id.startswith(prefix + '-'):
            stripped_deployment_id = deployment_id
            for possible_prefix in [p + '-' for p in constants.DEPLOYMENT_ID_PREFIXES]:
                if deployment_id.startswith(possible_prefix):
                    stripped_deployment_id = deployment_id[len(possible_prefix):]
                    break

            deployment_id_manager.set_deployment_id(
                prefix + '-' + stripped_deployment_id)

    @staticmethod
    def opt_in_for_cloud_instrumentation(services):
        '''
        Configures cloud instance instrumentation settings
        '''
        settings = {}

        current_opt_in_version = services.telemetry_conf_service.content.get('optInVersion')
        swa_endpoint_url = '/splunkd/__raw/servicesNS/nobody/splunk_instrumentation/telemetry-metric'

        # Being explicit about all opt-ins. Licensing's default
        # is changing to True for on-prem. Need to make sure it
        # remains disabled for cloud.
        settings.update({
            'optInVersionAcknowledged': current_opt_in_version,
            'sendAnonymizedWebAnalytics': True,
            'sendAnonymizedUsage': True,
            'sendLicenseUsage': True,
            'onCloudInstance': True,
            'swaEndpoint': swa_endpoint_url
        })

        services.telemetry_conf_service.update(settings)

    @staticmethod
    def migrate_licensing_opt_in_default(services):
        '''
        Checks if the current opt-in values have been acknowledged
        by the user. If not, they are the previous defaults, so we
        can enable license data reporting as the new default.

        Note that we could not simply push a new default out in the
        default/telemetry.conf file, since splunkd will not write
        a value to local conf files if their value is the same as
        the default value. This means we would have risked changing
        explicit opt-outs to opt-ins without user permissions.
        '''

        # Check legacy showOptInModal field to see if a user has acked
        # the licensing opt-in/opt-out.

        if services.telemetry_conf_service.content.get('showOptInModal') == '0':
            return

        # Check the new optInVersionAcknowledged flag

        opt_in_version_acked = services.telemetry_conf_service.content.get('optInVersionAcknowledged')
        if opt_in_version_acked is not None and int(opt_in_version_acked) != 0:
            return

        services.telemetry_conf_service.update({'sendLicenseUsage': True})


def main(services,
         salt_manager,
         deployment_id_manager,
         OnSplunkStart):

    OnSplunkStart.wait_for_kv_store_started(services)

    OnSplunkStart.initialize_salt(salt_manager)

    OnSplunkStart.initialize_deployment_id(services, deployment_id_manager)

    if services.server_info_service.is_cloud():
        OnSplunkStart.opt_in_for_cloud_instrumentation(services)
    else:
        # Cloud should never opt-in for license sharing,
        # so only apply the default on-prem
        OnSplunkStart.migrate_licensing_opt_in_default(services)


if __name__ == '__main__':
    try:
        token = sys.stdin.read().rstrip()
        splunkd = Splunkd(token=token, server_uri=constants.SPLUNKD_URI)
        services = ServiceBundle(splunkd)
        salt_manager = SaltManager(services)
        deployment_id_manager = DeploymentIdManager(
            services.splunkd,
            telemetry_conf_service=services.telemetry_conf_service,
            server_info_service=services.server_info_service
        )
        main(services, salt_manager, deployment_id_manager, OnSplunkStart)
    except Exception as e:
        logger.error(e)
        exit(0)
