# python imports
from __future__ import print_function, absolute_import
import sys
from typing import List, Dict, Any

import json
# if collector is ran from CLI
from rapid_diag.collector.log_level_changer import LogLevelChanger
from rapid_diag.collector.collector_result import CollectorResult, AggregatedCollectorResult
# local imports

from rapid_diag.collector.trigger.scoped_action import ScopedAction, ScopedOperationError, ScopeActionExecutionMode
from rapid_diag.serializable import Serializable, JsonObject
from rapid_diag.collector.collector import Collector

import splunk
import splunklib.client as client
from splunklib.client import AuthenticationError, HTTPError, Entity
import logger_manager as log

_LOGGER = log.setup_logging("scoped_action_log_level")
IS_LINUX = sys.platform.startswith('linux')


class ScopedLogLevelAction(ScopedAction):
    """ Scoped log level action which is scoped class that will run scoped pre-collection,
                collection followed by a post collection """
    def __init__(self, channels: List[str], collectors: List[Collector],
                 loglevel: str,
                 state: Collector.State = Collector.State.WAITING,
                 ) -> None:
        self.pre_collectors: List[Collector] = []
        self.post_collectors: List[Collector] = []
        ScopedAction.__init__(self, self.pre_collectors, collectors, self.post_collectors,
                              ScopeActionExecutionMode.RUN_POST_ON_PRE_SUCCESS, state)
        self.channels: List[str] = channels
        self.loglevel: str = loglevel
        self.original_log_levels: Dict[str, str] = {}

    def get_splunk_service(self, token: Any) -> Entity:
        """Get splunk service connection"""
        try:
            service = client.connect(host=splunk.getDefault('host'),
                                          port=splunk.getDefault('port'),
                                          scheme=splunk.getDefault('protocol'),
                                          token=token,
                                          autologin=True,
                                          )
        except AuthenticationError as aut_error:
            raise ScopedOperationError('Request failed: Session is not logged in', aut_error) from aut_error
        return service

    def set_current_log_levels(self, token: Any ) -> None:
        """ get the current log level and set save it for fault back purpose"""
        failures: List[str] = []
        service = self.get_splunk_service(token)

        for channel in self.channels:
            try:
                kwargs_export = {"output_mode": "json"}
                ret = service.get("/services/server/logger/" + channel , None, None, **kwargs_export)
                body = json.loads(ret['body'].read())
                current_level = body['entry'][0]['content']['level']
                self.original_log_levels[str(channel)] = str(current_level)
            except HTTPError:
                failures.append(channel)

        if len(failures) > 0:
            raise ScopedOperationError("Cannot extract current log level for the channels", "unable to fetch")
        _LOGGER.info(
            'current log channels fetched = %s' , str(len(self.original_log_levels)))

    def get_loglevel(self) -> str:
        """ get log levels"""
        if len(self.original_log_levels) > 0:
            return self.original_log_levels[self.channels[0]]
        raise ScopedOperationError("previous log levels cannot be fetched", "log level fetch error")

    def _collect_impl(self, run_context: Collector.RunContext) -> CollectorResult:
        self.store_old_pre_settings(run_context)
        result = AggregatedCollectorResult()
        try:
            self.pre_collectors.append(LogLevelChanger(self.channels, self.loglevel))
            self.post_collectors.append(LogLevelChanger(self.channels, self.get_loglevel()))
            self.run_collectors_with_mode(result, run_context)
        except ScopedOperationError as exc:
            return CollectorResult.Failure("scoped action trigger failed {}".format(exc))
        except ValueError as val_error:
            return CollectorResult.Failure("Unknown error {}".format(val_error))
        return CollectorResult.Failure("Scoped action failed") if not result.isSuccess() else result

    def store_old_pre_settings(self, run_context: Collector.RunContext) -> None:
        """ do additional pre-setup preparation"""
        self.set_current_log_levels(run_context.session_token)

    def get_type(self) -> Collector.Type:
        return Collector.Type.SCOPED

    def __repr__(self) -> str:
        return "Scoped_log_level_action"

    def needs_auth(self) -> bool:
        return True

    def _get_json(self) -> JsonObject:
        return {
            'log_channels': self.channels,
            'collectors': self.collectors,
            'log_level': self.loglevel
        }

    @staticmethod
    def validate_json(obj: JsonObject) -> None:
        data_types = {"collectors": (list,), "log_channels": (list,), "log_level": (str,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

    @staticmethod
    def from_json_obj(obj: JsonObject) -> 'ScopedLogLevelAction':
        return ScopedLogLevelAction(obj["log_channels"], obj['collectors'], obj["log_level"],
                                    Collector.State[obj.get("state", Collector.State.WAITING.name).upper()])


Serializable.register(ScopedLogLevelAction)
