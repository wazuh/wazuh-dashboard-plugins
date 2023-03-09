"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
from spacebridgeapp.util.time_utils import get_current_timestamp

class CachedResult(object):
    """ Small wrapper class to encapsulate cached variables with an associated TTL """
    def __init__(self, value, ttl=3600):
        self.value = value
        self.ttl = ttl
        self.timestamp = get_current_timestamp()

    def is_valid(self):
        return (get_current_timestamp() - self.timestamp) < self.ttl


