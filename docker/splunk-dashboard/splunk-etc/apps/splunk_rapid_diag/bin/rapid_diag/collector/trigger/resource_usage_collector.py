# pylint: disable=missing-function-docstring,missing-class-docstring
from __future__ import absolute_import
from abc import abstractmethod


class ResourceUsageCollector:
    def __init__(self):
        self.last_iteration = None

    @staticmethod
    @abstractmethod
    def get_metric():
        pass

    @abstractmethod
    def get_target(self):
        pass

    @abstractmethod
    def get_current_usage(self):
        pass

    @abstractmethod
    def _update(self):
        pass

    # this is a trick so we can collect synchronized data on 2 metrics derived from the same source
    def update(self, iteration):
        try:
            if iteration == self.last_iteration:
                return True
        except AttributeError:
            pass
        self.last_iteration = iteration
        return self._update()
