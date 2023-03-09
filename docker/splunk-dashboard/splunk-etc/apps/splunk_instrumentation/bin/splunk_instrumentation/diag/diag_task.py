from splunk_instrumentation.diag.batch_runner import Task


class DiagTask(Task):
    """
    Is a batch_runner task for diags.
    """

    def __init__(self, config, diag_service):
        """

        :param config: the diags config from request { node:..., configuration:...}
        :param diag_service: DiagService instance
        """
        self.config = config
        self.diag_service = diag_service

    def run(self):
        """
        calls the diag service to create a diag from a remote machine
        :return:
                { diagFilename : "",
                          size : n
                           }
        """

        return self.diag_service.create_node_diag_task(self.config)

    def to_dict(self):
        """
        returns the config
        :return:
          config
        """
        return self.config.get('node')
