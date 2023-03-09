"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
class JobResult(object):
    def __init__(self, completed, search=None, subscription_updates=None):
        self.completed = completed
        self.search = search
        self.subscription_updates = subscription_updates

