"""
(C) 2019 Splunk Inc. All rights reserved.
"""


class SodiumProcessError(Exception):
    def __init__(self):
        self.message = "libsodium server process has stopped"

    def __repr__(self):
        return self.message


class SodiumOperationError(Exception):
    def __init__(self, m=None):
        if m is None:
            m = "libsodium operation failed"
        else:
            m = "libsodium operation failed: {}".format(m)
        self.message = m

    def __repr__(self):
        return self.message
