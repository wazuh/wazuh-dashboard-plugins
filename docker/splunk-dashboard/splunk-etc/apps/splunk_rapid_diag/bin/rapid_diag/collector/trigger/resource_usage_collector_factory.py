# pylint: disable=missing-function-docstring,missing-class-docstring
from __future__ import absolute_import
from rapid_diag.collector.trigger.resource_usage_metrics import SystemwideCpuUsageCollector
from rapid_diag.collector.trigger.resource_usage_metrics import SystemwideMemory
from rapid_diag.collector.trigger.resource_usage_metrics import SystemwidePhysicalMemoryUsageCollector
from rapid_diag.collector.trigger.resource_usage_metrics import SystemwideVirtualMemoryUsageCollector


class ResourceUsageCollectorFactory:

    def __init__(self):
        self.systemwide_memory = SystemwideMemory()

    def _systemwide_memory(self):
        try:
            return self.systemwide_memory
        except AttributeError:
            self.systemwide_memory = SystemwideMemory()
        return self.systemwide_memory

    buildmap = {
        'system': {
            SystemwideCpuUsageCollector.get_metric():
                    lambda self: SystemwideCpuUsageCollector(),
            SystemwidePhysicalMemoryUsageCollector.get_metric():
                    lambda self: SystemwidePhysicalMemoryUsageCollector(self._systemwide_memory()), # pylint: disable=protected-access
            SystemwideVirtualMemoryUsageCollector.get_metric():
                    lambda self: SystemwideVirtualMemoryUsageCollector(self._systemwide_memory()) # pylint: disable=protected-access
        }
    }

    def build(self, target, metric):
        if target != 'system':
            raise ValueError('Invalid target ' + str(target))
        if metric not in ResourceUsageCollectorFactory.buildmap[target]:
            raise ValueError('Invalid metric ' + str(metric) + ' for target ' + str(target))
        return ResourceUsageCollectorFactory.buildmap[target][metric](self)
