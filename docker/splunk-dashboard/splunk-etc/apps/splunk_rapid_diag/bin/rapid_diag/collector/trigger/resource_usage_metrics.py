# pylint: disable=missing-function-docstring,missing-class-docstring
from __future__ import absolute_import
import platform
import subprocess
from functools import reduce
from rapid_diag.collector.trigger.resource_usage_collector import ResourceUsageCollector


IS_LINUX = platform.system().startswith('Linux')


def _run_wmic_command(command_args):
    cmd = "wmic " + command_args
    output = subprocess.check_output(cmd)
    output_arr = output.split()

    return reduce(lambda a, b: float(a) + float(b), output_arr[1:], 0) / max(1, len(output_arr[1:]))


class SystemwideCpuUsageCollector(ResourceUsageCollector):
    def __init__(self):
        ResourceUsageCollector.__init__(self)
        self.prev_non_idle = None
        self.prev_total = None
        self.non_idle = None
        self.total = None

    def __repr__(self):
        return SystemwideCpuUsageCollector.get_metric()

    @staticmethod
    def get_metric():
        return 'cpu'

    def get_target(self):
        return 'system'

    def _update(self):
        if IS_LINUX:
            self._update_linux_metric()

    def _update_linux_metric(self):
        with open("/proc/stat", "r") as f:
            for line in f:
                data = line.strip().split()
                if data[0] == "cpu":
                    break
            else:
                raise RuntimeError(
                    'Could not obtain CPU usage from /proc/stat.')

        idle = 0.0
        non_idle = 0.0
        for i, value in enumerate(data):
            if i == 0:
                pass
            elif i in (4, 5):
                idle += float(value)
            else:
                non_idle += float(value)
        self.prev_non_idle = self.non_idle
        self.prev_total = self.total
        self.non_idle = non_idle
        self.total = idle + non_idle

    def get_current_usage(self):
        if not IS_LINUX:
            return float(_run_wmic_command("CPU GET LoadPercentage"))
        non_idle = self.non_idle - \
            (self.prev_non_idle if self.prev_non_idle else 0.)
        total = self.total - (self.prev_total if self.prev_total else 0.)
        if not total:
            return 0.
        return (non_idle / total) * 100


class SystemwideMemory:
    def __init__(self):
        self.total_physical_memory = None
        self.available_physical_memory = None
        self.total_virtual_memory = None
        self.available_virtual_memory = None

    def _update_linux_metric(self):
        # MemAvailable is included in /proc/meminfo since version 3.14 of
        # the kernel.
        # To calculate MemAvailable for lower versions of the kernel
        # we can use MemFree + Buffers + Cached as MemAvailable.
        self.available_physical_memory = None
        mem_alt = {'MemFree:': None, 'Buffers:': None, 'Cached:': None}
        with open("/proc/meminfo", "r") as f:
            for line in f:
                data = line.strip().split()
                if data[0] == "MemTotal:":
                    self.total_physical_memory = int(data[1])
                elif data[0] == "MemAvailable:":
                    self.available_physical_memory = int(data[1])
                elif data[0] == "SwapTotal:":
                    self.total_virtual_memory = int(data[1])
                elif data[0] == "SwapFree:":
                    self.available_virtual_memory = int(data[1])
                elif data[0] in mem_alt:
                    mem_alt[data[0]] = int(data[1])
        if self.available_physical_memory is None:
            total = 0
            for val in mem_alt.values():
                if val is None:
                    total = None
                    break
                total += val
            self.available_physical_memory = total

    def get_physical_memory_usage(self):
        total_physical_memory = self.get_total_physical_memory()
        if not IS_LINUX:
            return total_physical_memory - float(_run_wmic_command("OS get FreePhysicalMemory"))
        return total_physical_memory - self.available_physical_memory

    def get_total_physical_memory(self):
        if not IS_LINUX:
            return self.__convert_bytes_to_kb(_run_wmic_command("ComputerSystem get TotalPhysicalMemory"))
        return self.total_physical_memory

    def __convert_bytes_to_kb(self, memory_in_bytes):
        return float(memory_in_bytes)/1024.0

    def get_virtual_memory_usage(self):
        total_virtual_memory = self.get_total_virtual_memory()
        if not IS_LINUX:
            return total_virtual_memory - float(_run_wmic_command("OS get FreeVirtualMemory"))
        return total_virtual_memory - self.available_virtual_memory

    def get_total_virtual_memory(self):
        if not IS_LINUX:
            return float(_run_wmic_command("OS get TotalVirtualMemorySize"))
        return self.total_virtual_memory


class SystemwidePhysicalMemoryUsageCollector(ResourceUsageCollector):
    def __init__(self, system_wide_memory):
        ResourceUsageCollector.__init__(self)
        self.system_wide_memory = system_wide_memory

    def __repr__(self):
        return SystemwidePhysicalMemoryUsageCollector.get_metric()

    def _update(self):
        if IS_LINUX:
            self.system_wide_memory._update_linux_metric() # pylint: disable=protected-access

    def get_current_usage(self):
        return self.system_wide_memory.get_physical_memory_usage()

    @staticmethod
    def get_metric():
        return 'physical_memory'

    def get_target(self):
        return 'system'


class SystemwideVirtualMemoryUsageCollector(ResourceUsageCollector):
    def __init__(self, system_wide_memory):
        ResourceUsageCollector.__init__(self)
        self.system_wide_memory = system_wide_memory

    def __repr__(self):
        return SystemwideVirtualMemoryUsageCollector.get_metric()

    def _update(self):
        if IS_LINUX:
            self.system_wide_memory._update_linux_metric() # pylint: disable=protected-access

    def get_current_usage(self):
        return self.system_wide_memory.get_virtual_memory_usage()

    @staticmethod
    def get_metric():
        return 'virtual_memory'

    def get_target(self):
        return 'system'
