# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import absolute_import
import os
import json
import threading
import getpass

from enum import Enum
from typing import Callable, Optional, List, Any

# local imports
import logger_manager as log
from rapid_diag.util import get_splunkhome_path
from rapid_diag.conf_util import RapidDiagConf
from rapid_diag.serializable import Serializable

_LOGGER = log.setup_logging("tool_manager")

DEFAULT_BASE_TOOLPATH = os.path.normpath(get_splunkhome_path(['etc', 'apps', 'splunk_rapid_diag', 'bin', 'tools']))

class FailureCode(Enum):
    TOOL_UNAVAILABLE = 0
    PERMISSION_ISSUE = 1

class ToolAvailabilityManager:

    def __init__(self) -> None:
        self.lock = threading.Lock()

        tool_manager_path = get_splunkhome_path(
            ["var", "run", "splunk", "splunk_rapid_diag"])
        self.tools = {}
        if not os.path.isdir(tool_manager_path):
            os.makedirs(tool_manager_path)
        self.available_tool_path = os.path.join(
            tool_manager_path, 'available_tools.json')
        try:
            if os.path.isfile(self.available_tool_path):
                with open(self.available_tool_path, 'r') as at_file:
                    self.tools = json.load(at_file)
        except Exception as e: # pylint: disable=broad-except
            _LOGGER.exception("Error loading '%s': %s", self.available_tool_path, str(e))

    def set_available(self, utility_name : str, status : Any) -> None:
        with self.lock:
            if utility_name in self.tools and self.tools[utility_name] == status:
                return
            self.tools[utility_name] = status
            with open(self.available_tool_path, 'w+') as at_file:
                json.dump(self.tools, at_file, default=Serializable.json_encode)

    def is_available(self, utility_name : str) -> bool:
        with self.lock:
            return bool(utility_name in self.tools and self.tools[utility_name] == True) # pylint: disable=singleton-comparison

    def get_tool_message(self, utility_name : str) -> Any:
        # get_tool_message should be called after set_available because if key is not available it will return KeyError
        with self.lock:
            return self.tools[utility_name]

    def reset(self) -> None:
        with self.lock:
            self.tools = {}
            with open(self.available_tool_path, 'w+') as at_file:
                json.dump(self.tools, at_file, default=Serializable.json_encode)

    @staticmethod
    def get_tool_paths() -> List[str]:
        """creates a list of a path which should be explored for finding utility

        NOTE:
        * if toolpath is not updated in `rapid_diag.conf` it will take '$SPLUNK_HOME/etc/apps/splunk_rapid_diag/bin/tools'
          as default path
        * We are using a list instead of a set because set in an unordered collection due to which insertion
          will change the order of elements.
        * In case of a set, Indexes of the path will be different(because sets are unordered collection) and if we have
          multiple versions of utility tools then we can't be sure which version is invoked by the program.
        * In case of a list, there should be duplications only if the PATH variable contains duplicate values
        * `base_toolpath` will have have maximum priority.

        Returns
        -------
        [list]
            list of directory paths
        """

        paths = []
        env_path = os.environ.get("PATH")
        if env_path:
            paths = env_path.split(os.pathsep)

        base_toolpath = os.path.normpath(os.path.join(os.path.dirname(
            os.path.dirname(os.path.dirname(os.path.realpath(__file__)))), 'tools'))

        try:
            conf_path = RapidDiagConf.get_tools_basepath()
            if conf_path and conf_path != DEFAULT_BASE_TOOLPATH:
                base_toolpath = conf_path
        except: # pylint: disable=bare-except
            pass
        paths.insert(0, base_toolpath)

        return paths

    @staticmethod
    def find(program : str) -> 'ToolManagerOutput':
        """finds the utilites in system and app directories.

        Verifies following:
        1. the utility path
        2. execute permission

        Parameters
        ----------
        program : string
            name of utility

        Returns
        -------
        ToolManagerOutput
            return object with `toolpath` or `error_message`
        """

        result = None
        paths = ToolAvailabilityManager.get_tool_paths()
        for path in paths:
            at_file = os.path.join(path, program)
            if os.path.exists(at_file) and os.path.isfile(at_file):
                # a good match should be returned straight away
                if os.access(at_file, os.X_OK):
                    # in Windows X_OK is meaningless, but we're only checking files with executable extensions,
                    # which is the Windows way of saying X_OK, so this works fine
                    return ToolManagerOutput(at_file, None)
                # if we don't find any good binary, report permission error for the first bad match
                if result is None:
                    result = ToolManagerOutput(None, program + " doesn't have execute permission for the current user.",
                                               FailureCode.PERMISSION_ISSUE)
        # and if we find nothing, we report that too
        if result is None:
            result = ToolManagerOutput(None, "Could not detect `" + str(program) + "` for the "+ getpass.getuser()
                                       + " user." , FailureCode.TOOL_UNAVAILABLE)
        return result


class ToolManagerOutput:

    def __init__(self, toolpath : Optional[str] = None,
                       error_message : Optional[str] = None,
                       failure_code : Optional[FailureCode] = None) -> None:
        self.toolpath : Optional[str] = toolpath
        self.error_message : Optional[str] = error_message
        self.failure_code : Optional[FailureCode] = failure_code
        self.log_level : Callable = _LOGGER.info if failure_code == FailureCode.TOOL_UNAVAILABLE else _LOGGER.error

    def __repr__(self) -> str:
        return 'ToolManagerOutput(%r, %r, %r)' % (self.toolpath, self.error_message, self.failure_code)
