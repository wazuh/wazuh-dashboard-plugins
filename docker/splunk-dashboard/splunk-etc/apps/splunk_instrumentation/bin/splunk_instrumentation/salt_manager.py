import uuid
import splunk_instrumentation.splunklib as splunklib
import splunk_instrumentation.constants as constants
from splunk_instrumentation.splunklib.data import Record


# Salt Lifecycle:
# - On Splunk start @ swa-eligible node (search head, or single instance):
#   + Sync with cluster master (CM salt overwrites any existing local salt)
#   + Still no salt? Generate a new one, stick it in the conf file.
#   + Conf replication fairies take it from there.
# - On demand / on read (i.e. when requested to inject into swajs, etc)
#   + Read from conf file
#   + No salt in the conf file? Generate a new one
#   + Can't guarantee write access in this context due to user permissions,
#     so we can't write it back to the conf file
#   + At least attempt to use the same temporary salt until the next sync
# - On scripted input run (nightly)
#   + Sync with the cluster master (CM salt overwrite any existing local salt)

# Used when a salt cannot be found, or persisted to the conf file
temporary_salt = None


class SaltManager(object):

    def __init__(self, services):
        self.salt = None
        self.services = services

    def get_salt(self):
        """
        Get this deployment's salt. One will be generated if none yet exists.
        If the telemetry conf service in use is writable (because this was invoked
        in the context of a system-authenticated script, or by a user with the
        edit_telemetry_settings capability), it will be persisted for use by the
        cluster. Otherwise a temporary salt is returned.
        """
        global temporary_salt

        if self.salt is not None:
            return self.salt

        self.salt = self.services.telemetry_conf_service.content.get('telemetrySalt')

        # Unlike the deployment ID - which we do not bother to generate
        # if we cannot write it to the conf file - there *must* be a salt
        # to ensure anonymization of PII. So, even if we can't persist it,
        # we'll generate a one-time-only salt.
        #
        # Note: We sync with the cluster master at splunk startup,
        #       as well as each night during the scripted input run.
        if not self.salt:
            self.salt = temporary_salt or self.generate_salt()
            if self.services.telemetry_conf_service.is_read_only:
                temporary_salt = self.salt
            else:
                try:
                    self.write_salt_to_conf_file()
                except Exception:
                    temporary_salt = self.salt

        return self.salt

    def sync_with_cluster(self):
        """
        Pulls the value of the telemetry salt from the CM if one is found.
        This ensures usernames and other information are hashed consistently
        for all nodes in the cluster (for event correlation on the receiving end).
        """
        try:
            cm_salt = None

            resp = self.services.splunkd.request(
                constants.ENDPOINTS['MASTER_SETTINGS'],
                method='GET',
                owner='nobody',
                app=constants.INST_APP_NAME)
            data = splunklib.data.load(resp.get('body').read())
            entry = data['feed'].get('entry')
            if entry:
                if type(entry) is list:
                    salt_list = [value['content'].get('telemetrySalt') for value in entry]
                    if salt_list:
                        salt_list.sort()
                        cm_salt = salt_list[0]
                elif type(entry) is Record:
                    cm_salt = entry['content'].get('telemetrySalt')

            if cm_salt:
                self.salt = cm_salt
                self.write_salt_to_conf_file()
        except Exception:
            # Best effort only
            pass

    def generate_salt(self):
        """
        Generates a new salt. Does not save it,
        as this method may need to be used to generate
        a temporary salt when used in the context of a
        user that cannot write to the telemetry conf
        endpoint.
        """
        self.salt = str(uuid.uuid4())
        return self.salt

    def write_salt_to_conf_file(self):
        """
        Persists the instance's salt value to telemetry.conf
        """
        self.services.telemetry_conf_service.update({
            'telemetrySalt': self.salt
        })
