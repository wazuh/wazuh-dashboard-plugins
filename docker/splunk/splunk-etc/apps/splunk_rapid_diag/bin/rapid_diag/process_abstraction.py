# pylint: disable=missing-function-docstring,missing-class-docstring
# python imports
from __future__ import absolute_import
import re
import os
import csv
import sys
import time
import json
import threading
import argparse
from typing import Dict, Any, Optional, List
from splunklib import six

# local imports
from rapid_diag.util import get_splunkhome_path, get_platform_maxint
from rapid_diag.serializable import Serializable
from rapid_diag.serializable import JsonObject
from rapid_diag.process_match import ProcessMatch

# global variables
PPID_REX = re.compile(r"^PPid:\s*(\d+)$")
NAME_REX = re.compile(r"^Name:\s*(.+)$")
SID_REX = re.compile(r"\s--id=(\S+)")

IS_LINUX = sys.platform.startswith('linux')

class InfoCsvError(Exception):
    """Raised when reading info.csv"""
    pass

class ProcessNotFound(Exception):
    """Raised when PID is not found in the system"""
    pass

class Process(ProcessMatch, Serializable):
    """ Class representing a process (and it's properties) in the OS we want to work with
        in collectors.
    """
    def __init__(self, name : str, pid : int, ppid : int, args : str, process_type : str) -> None:
        Serializable.__init__(self)
        self.name : str = name
        self.pid : int = pid
        self.ppid : int = ppid
        self.args : str = args
        self.process_type : str = process_type

    def __str__(self) -> str:
        return str(self.to_json_obj())

    def __eq__(self, other : Any) -> bool:
        return bool(self.__dict__ == other.__dict__)

    def __ne__(self, other : Any) -> bool:
        return not self.__eq__(other)

    def may_match(self, other : Any) -> bool:
        # never match processes of different types
        if self.__class__ != other.__class__ or self.get_process_type() != other.get_process_type():
            return False
        return bool(self.name == other.name)

    def __repr__(self) -> str:
        return "%s (%r), Process Type: %s" % (self.name, self.pid, self.process_type)

    def get_process_type(self) -> str:
        return self.process_type

    def get_pid(self) -> int:
        return self.pid

    def get_custom_display_name(self) -> str:
        return self.name + ' - ' + self.process_type

    def get_process_name(self) -> str:
        return self.name

    def get_process_arguments(self) -> str:
        return self.args

    def to_json_obj(self) -> JsonObject:
        return {
            'name': self.name,
            'pid': self.pid,
            'ppid': self.ppid,
            'args': self.args,
            'process_type': self.process_type,
        }

    @staticmethod
    def validate_json(obj : JsonObject) -> None:
        data_types = {"name": (six.text_type,), "pid": (int,), "ppid": (int,),
                      "args": (six.text_type,), "process_type": (six.text_type,)}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

        # In windows max PID value is DWORD which is having lenght from [-2^32, 2^32-1]
        # In linux PID_MAX_LIMIT is 2^22 for 64bit machines
        value_range : Dict[str, List[float]] = {"pid": [0, 4294967295], "ppid": [0, 4294967295]}
        for field in list(filter(lambda x: x in obj.keys(), value_range.keys())):
            fval : float = float(obj[field])
            Serializable.check_value_in_range(fval, value_range[field], field)

        string_value = ["name", "process_type"]
        for field in list(filter(lambda x: x in obj.keys(), string_value)):
            sval : str = str(obj[field])
            Serializable.check_string_value(sval, field)

    @staticmethod
    def from_json_obj(obj : JsonObject) -> Serializable:
        return Process(str(obj['name']), int(obj['pid']), int(obj['ppid']), str(obj['args']), str(obj['process_type']))

Serializable.register(Process)

class SearchProcess(ProcessMatch, Serializable):
    def __init__(self, process : Process,  root_sid : str, label : str, ppc_app : str,
            ppc_user : str, search : str, owner : Optional[str] = None, app : Optional[str] = None):
        Serializable.__init__(self)
        self.process = process
        self.root_sid = root_sid
        self.savedsearch_name = label
        self.running_app = ppc_app
        self.running_user = ppc_user
        self.search = search
        self.owning_user = owner
        self.owning_app = app

    def __eq__(self, other : Any) -> bool:
        return bool(self.__dict__ == other.__dict__)

    def __ne__(self, other : Any) -> bool:
        return not self.__eq__(other)

    def __str__(self) -> str:
        process_dict = self.to_json_obj()
        process_dict.update({'process': process_dict['process'].to_json_obj()})
        return str(process_dict)

    def get_process_type(self) -> str:
        return self.process.process_type

    def get_pid(self) -> int:
        return self.process.pid

    def get_custom_display_name(self) -> str:
        return self.process.process_type

    def get_process_name(self) -> str:
        return self.process.name

    def get_process_arguments(self) -> str:
        return self.process.args

    @staticmethod
    def load_from_disk(process : Process, sid : str) -> 'SearchProcess':
        search_path : str = get_splunkhome_path(['var', 'run', 'splunk', 'dispatch', sid, 'info.csv'])
        with open(search_path, 'r') as info_csv:
            try:
                # Set the field size limit to the size of the maxint
                csv.field_size_limit(get_platform_maxint())
                dict_reader = csv.DictReader(info_csv)
                search_info = next(dict_reader)
            except (csv.Error) as ex:
                raise InfoCsvError('Unable to read from ' + str(search_path) + ': ' + str(ex)) from ex

        try:
            saved_search_info = json.loads(search_info["savedsearch_label"])
            return SearchProcess(process, search_info["_root_sid"], search_info["label"],\
                    search_info["_ppc.app"], search_info["_ppc.user"],\
                    search_info["_search"], saved_search_info["owner"], saved_search_info["app"])
        except (OSError, ValueError, TypeError, KeyError):
            return SearchProcess(process, search_info["_root_sid"], search_info["label"],\
                    search_info["_ppc.app"], search_info["_ppc.user"],\
                    search_info["_search"])


    def may_match(self, other : Any) -> bool:
        if not self.process.may_match(other.process):
            return False
        return bool(self.root_sid==other.root_sid or (self.savedsearch_name!="" and
                   self.savedsearch_name==other.savedsearch_name) or self.search==other.search)

    def __repr__(self) -> str:
        return "%r, Search: %s, Saved search name: %s, Root SID: %s" %\
                (self.process, self.search, self.savedsearch_name, self.root_sid)

    def to_json_obj(self) -> JsonObject:
        return {
            'process': self.process,
            'root_sid': self.root_sid,
            'savedsearch_name': self.savedsearch_name,
            'running_app': self.running_app,
            'running_user': self.running_user,
            'search': self.search,
            'owning_user': self.owning_user,
            'owning_app': self.owning_app,
        }

    @staticmethod
    def validate_json(obj : JsonObject) -> None:
        data_types = {"process": (object,), "root_sid": (six.text_type,),
                      "savedsearch_name": (six.text_type,), "running_app": (six.text_type,),
                      "running_user": (six.text_type,), "search": (six.text_type,),
                      "owning_user": (six.text_type, type(None)), "owning_app": (six.text_type, type(None))}
        for field in list(filter(lambda x: x in obj.keys(), data_types.keys())):
            Serializable.check_data_type(obj[field], data_types[field], field)

        string_value = ["root_sid", "savedsearch_name", "running_app", "running_user"]
        for field in list(filter(lambda x: x in obj.keys(), string_value)):
            Serializable.check_string_value(str(obj[field]), field)

    @staticmethod
    def from_json_obj(obj : JsonObject) -> Serializable:
        return SearchProcess(obj['process'], obj['root_sid'], obj['savedsearch_name'],
                             obj['running_app'], obj['running_user'], obj['search'],
                             obj.get('owning_user'), obj.get('owning_app'))

Serializable.register(SearchProcess)

class ProcessLister:
    CACHE_TTL = 2

    def __init__(self) -> None:
        self.read_lock : threading.Lock = threading.Lock()
        self.refresh_lock : threading.Lock = threading.Lock()
        self.listing : List[Process] = [] # DO NOT ACCESS DIRECTLY, use `get_process_listing()`
        self.refresh_time : float = 0.
        self.refreshing : bool = False

    @staticmethod
    def build_process_from_args(args : argparse.Namespace) -> Process:
        if args.pid != 0:
            return ProcessLister.build_process_from_pid(args.pid)
        return ProcessLister.build_process(args.name, args.pid, args.ppid, [args.args])

    @staticmethod
    def build_process(name : str, pid : int, ppid : int, args_l : List[str]) -> Process: # pylint: disable=too-many-branches
        args : str = ' '.join(args_l)
        process_type = 'other'
        if name and args:
            if name == 'splunkd':
                if 'search' in args:
                    match = re.search(SID_REX, args)
                    if match:
                        return SearchProcess.load_from_disk(Process(name, pid, ppid, args, 'splunk search'), match.group(1))
                    process_type = 'splunk search runner'
                elif 'process-runner' in args:
                    process_type = 'splunk process-runner'
                elif (' -p ' in args and 'start' in args) or args.endswith(' service'):
                    process_type = 'splunkd server'
                elif 'fsck' in args or 'recover-metadata' in args or 'cluster_thing' in args:
                    process_type = 'splunk index service'
                elif 'instrument-resource-usage' in args:
                    process_type = 'splunk scripted input'
            elif name.startswith('python'):
                if ('appserver' in args and 'mrsparkle' in args and 'root.py' in args) or args.startswith('splunkweb'):
                    process_type = 'splunk web'
            elif name.startswith('mongod'):
                if os.path.join('var', 'lib', 'splunk', 'kvstore', 'mongo') in args:
                    process_type = 'splunk kvstore'
        return Process(name, pid, ppid, args, process_type)

    @staticmethod
    def build_process_from_pid(pid : int) -> Process:
        try:
            if IS_LINUX:
                return ProcessLister._build_process_linux(pid)
            return ProcessLister._build_process_windows(pid)
        except OSError as e:
            raise ProcessNotFound('Unable to find a matching process for pid=' + str(pid) + ': ' + str(e)) from e

    @staticmethod
    def _build_process_windows(pid : int) -> Process:
        import wmi
        import pythoncom

        pythoncom.CoInitialize()
        wmi_obj = wmi.WMI()

        process = wmi_obj.Win32_Process(processid=pid)[0]
        name = process.Name.split(".exe")[0]
        pid = process.ProcessId
        ppid = process.ParentProcessId
        args = process.CommandLine.split('\0') if process.CommandLine else [str(process.CommandLine)]

        return ProcessLister.build_process(name, int(pid), int(ppid), args)

    @staticmethod
    def get_process_listing_windows() -> List[Process]:
        import wmi
        import pythoncom

        pythoncom.CoInitialize()

        wmi_obj = wmi.WMI()
        listing = []
        for process in wmi_obj.Win32_Process():
            try:
                process = ProcessLister.build_process_from_pid(process.ProcessId)
                listing.append(process)
            except IndexError:
                continue
            except ProcessNotFound:
                continue

        return listing

    @staticmethod
    def _build_process_linux(pid : int) -> Process:
        with open(os.path.join('/proc', str(pid), 'cmdline'), 'r') as proc_cmdline:
            args = [line for line in proc_cmdline.read().split('\0') if line]

        with open(os.path.join('/proc', str(pid), 'status'), 'r') as proc_status:
            ppid = None
            name = None

            for line in proc_status:
                if re.match(PPID_REX, line):
                    ppid = line.split(":")[1].strip()
                if re.match(NAME_REX, line):
                    name = line.split(":")[1].strip()
                if ppid and name:
                    break
            if ppid is None:
                ppid = "1"
            if name is None:
                name = args[0]
        return ProcessLister.build_process(name, int(pid), int(ppid), args)

    @staticmethod
    def get_process_listing_linux() -> List[Process]:
        listing = []
        for pid in [int(pid) for pid in os.listdir('/proc') if pid.isdigit()]:
            try:
                process = ProcessLister.build_process_from_pid(pid)
                listing.append(process)
            except IOError:
                continue
            except ProcessNotFound:
                continue
        return listing

    def get_process_listing(self, force_refresh : bool = False) -> List[Process]:
        with self.read_lock:
            if self.listing and not force_refresh:
                now = time.time()
                age = now - self.refresh_time
                if age < ProcessLister.CACHE_TTL or self.refreshing:
                    return self.listing[:] # return copy to avoid races
            self.refreshing = True
        with self.refresh_lock: # this second lock is meant to prevent cache stampedes
            if self.listing and not force_refresh:
                # the only way we got here is if previously `self.listing` evaluated to False
                # -- that means we'd better return whatever the age, because if extracting the
                # list takes longer than TTL we don't want to keep doing it over and over
                return self.listing[:]

            if IS_LINUX:
                listing = ProcessLister.get_process_listing_linux()
            else:
                listing = ProcessLister.get_process_listing_windows()

            with self.read_lock:
                self.listing = listing
                self.refresh_time = time.time()
                self.refreshing = False
            return self.listing[:]

    def get_best_running_match(self, process : Optional[Process]) -> Optional[Process]:
        listing = self.get_process_listing()
        best : Optional[Process] = None
        best_score = 0
        if process is not None:
            for proc in listing:
                try:
                    if proc.may_match(process):
                        score = proc.get_match_score(process)
                        if score > best_score:
                            best = proc
                            best_score = score
                except: # pylint: disable=bare-except
                    continue
        return best

    def get_ui_process_list(self) -> Dict[str, str]:
        process_list : List[str] = []
        for proc in self.get_process_listing():
            process_list.append(
                json.dumps(proc, default=self.json_encoder)
            )
        process_dict = { str(i) : process_list[i] for i in range(0, len(process_list)) }

        return process_dict

    @staticmethod
    def json_decoder(json_dict : JsonObject) -> Serializable:
        if "process" in json_dict:
            json_dict["process"] = Process.from_json_obj(json_dict["process"])
            return SearchProcess.from_json_obj(json_dict)
        return Process.from_json_obj(json_dict)

    def json_encoder(self, obj : Serializable) -> JsonObject:
        if hasattr(obj, 'to_json_obj'):
            return obj.to_json_obj()
        raise TypeError('Can\'t serialize "{!s}"={!s}'.format(type(obj), obj))
