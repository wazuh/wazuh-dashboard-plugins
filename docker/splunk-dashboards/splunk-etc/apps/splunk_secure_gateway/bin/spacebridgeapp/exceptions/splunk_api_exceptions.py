"""Copyright (C) 2009-2021 Splunk Inc. All Rights Reserved."""
class EncryptionKeyError(Exception):
    def __init__(self, message, http_code):
        self.message = "Unable to retrieve encryption keys with error={}".format(message)
        self.http_code = http_code

    def __str__(self):
        return "status=%s %s" % (self.http_code, self.message)
