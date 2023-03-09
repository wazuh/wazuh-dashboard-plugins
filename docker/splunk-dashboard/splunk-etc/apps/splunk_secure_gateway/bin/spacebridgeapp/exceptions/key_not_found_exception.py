"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""


class KeyNotFoundError(Exception):
    def __init__(self, key_id, http_code):
        self.message = "%s not found" % key_id
        self.http_code = http_code

    def __str__(self):
        return "status=%s %s" % (self.http_code, self.message)
