class DiscoveryError(Exception):

    def __init__(self, prefix: str, code: int, message: str):
        super().__init__(f'{prefix} ({code}): {message}')
        self.code = code