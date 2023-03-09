import json
import time

from splunk_instrumentation.constants import ENDPOINTS, INST_APP_NAME, DIAG_STATUS_MSG


class DiagService(object):
    """
    DiagService is a helper class that manages node diags and tracks them in events
    """

    def __init__(self, splunkd=None, diag_filepath="", batch_id=None):
        self.splunkd = splunkd
        self.diag_filepath = diag_filepath
        self.batch_id = batch_id

    def get_batch_id(self):
        """
        return the unique id for the batch of diags being ran
        there is one idea for all the diags ran in a batch.

        :return:
            batch id

        """
        return self.batch_id

    def create_node_diag_task(self, config):
        """
        takes a config and calls the diag endpoint to create a diag

        :param config:
                { node : {},
                  configuration : {}
                  }
        :return:
                { diagFilename : "",
                  size : n
                  }
        """
        configuration = config['configuration'].copy()
        configuration.pop('mode', None)  # Remove debug only field

        body = json.dumps({
            'batchID': self.get_batch_id(),
            'node': {
                'uri': config['node']['uri'],
                'authMethod': config['node']['authMethod']
            },
            'configuration': configuration
        })

        try:
            create_resp = self.splunkd.service.request(ENDPOINTS['DIAG_ENDPOINT'],
                                                       method="POST",
                                                       body=body,
                                                       headers=[('content-type', 'application/json')],
                                                       owner='nobody',
                                                       app=INST_APP_NAME)
        except Exception as ex:
            raise Exception("Diag Remote Failed: {}".format(ex))

        if create_resp.status < 200 or create_resp.status >= 300:
            raise Exception("Diag Remote invalid status {}".format(create_resp.status))

        data = create_resp.get('body').read()
        data = json.loads(data)

        sync_error_count = 0
        while True:
            try:
                statuses = self.splunkd.get_json(ENDPOINTS['DIAG_STATUS'],
                                               owner='nobody',
                                               app=INST_APP_NAME)
                for item in statuses:
                    json_item = json.loads(item)
                    if (json_item['daigID'] == data['diagID']):
                        status = item
                        break

            except Exception as ex:
                sync_error_count += 1
                if sync_error_count > 5:
                    return {'status': 'failed', 'description': str(ex)}

            if status.get('status') != DIAG_STATUS_MSG['PROGRESS']:
                return status

            time.sleep(2)
