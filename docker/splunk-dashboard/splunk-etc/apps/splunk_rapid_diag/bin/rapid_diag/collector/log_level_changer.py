# python imports
from __future__ import print_function, absolute_import
import os
import sys
from typing import List, cast
from rapid_diag.serializable import JsonObject

# if collector is ran from CLI

SPLUNK_HOME = os.environ.get('SPLUNK_HOME')
SPLUNK_DB = os.environ.get('SPLUNK_DB')
if not SPLUNK_HOME or not SPLUNK_DB:
    print('ERROR: SPLUNK_HOME and SPLUNK_DB must be set in environment path.\n'
          'Execute the file via Splunk\'s python e.g $SPLUNK_HOME/bin/splunk cmd python <file_name.py>',
          file=sys.stderr)
    sys.exit(1)
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.realpath(__file__)))))

# local imports

from rapid_diag.collector.collector import Collector
from rapid_diag.collector.collector_result import CollectorResult
from rapid_diag.serializable import Serializable


# splunk imports
import splunk
import splunklib.client as client
from splunklib.client import AuthenticationError, HTTPError
import logger_manager as log

_LOGGER = log.setup_logging("LogLevelChanger")


class LogLevelChanger(Collector):
    """ Change the log level of a given log channel"""

    def __init__(self, channels: List[str], level: str, state: Collector.State = Collector.State.WAITING):
        Collector.__init__(self)
        self.state: Collector.State = state
        self.channels = channels
        self.level = level

    def get_type(self) -> Collector.Type:
        return Collector.Type.SNAPSHOT

    def get_required_resources(self) -> List:
        return []

    def __repr__(self) -> str:
        return "log-level-changer"

    def _get_json(self) -> JsonObject:
        return {
            'log_level': self.level,
            'log_channels': self.channels
        }

    @staticmethod
    def validate_json(obj: JsonObject) -> None:
        data_types = {"log_channels": (list,), "log_level": (str,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

    @staticmethod
    def from_json_obj(obj: JsonObject) -> 'LogLevelChanger':
        channels: List[str] = cast(list, obj.get("log_channels"))
        ret = LogLevelChanger(channels, str(obj.get("log_level")))
        ret.set_result(obj.get("result", None))
        return ret

    def needs_auth(self) -> bool:
        return True

    def _collect_impl(self, run_context: Collector.RunContext) -> CollectorResult:
        '''change the log level for the collectors'''
        self.promote_state(Collector.State.COLLECTING, run_context.state_change_observers)
        try:
            service = client.connect(host=splunk.getDefault('host'),
                                     port=splunk.getDefault('port'),
                                     scheme=splunk.getDefault('protocol'),
                                     token=run_context.session_token,
                                     autologin=True,
                                     )
        except AuthenticationError:
            return CollectorResult.Failure('Request failed: Session is not logged in', _LOGGER)

        _LOGGER.info('Successfully authenticated in Log level changer')
        failures: List[str] = []
        for channel in self.channels:
            try:
                _LOGGER.debug('changing log level for ' + channel + " with level" + self.level)
                service.post("/services/server/logger/" + channel, level=self.level)
            except HTTPError:
                failures.append(channel)

        _LOGGER.info(
            'Starting Log Level Changer collector, outputDir=%s suffix=%s',
            run_context.output_dir, run_context.suffix)
        if len(failures) > 0:
            return CollectorResult.Failure("setting the log level failed with ".join(failures))
        return CollectorResult.Success("Successfully switched all log levels")


Serializable.register(LogLevelChanger)
