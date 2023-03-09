"""
Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved.
"""


class RunAsTokenExpiredError(Exception):
    def __init__(self, message="RunAs Token Expired Error"):
        self.message = message

    def __str__(self):
        return "message={} ".format(self.message)

class RunAsTokenInvalidSignature(Exception):
    def __init__(self, message="RunAs Token signature is invalid"):
        self.message = message

    def __str__(self):
        return "message={} ".format(self.message)
