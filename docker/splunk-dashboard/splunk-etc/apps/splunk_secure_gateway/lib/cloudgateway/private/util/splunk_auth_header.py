
class SplunkAuthHeader(object):
    def __init__(self, session_token):
        self.session_token = session_token

    def __repr__(self):
        return 'Splunk {0}'.format(self.session_token)

