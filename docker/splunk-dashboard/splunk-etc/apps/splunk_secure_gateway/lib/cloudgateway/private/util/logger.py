class DummyLogger(object):
    def __getattr__(self, name):
        return lambda *x: None