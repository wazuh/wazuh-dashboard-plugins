from http import HTTPStatus


class RegistrationError(Exception):

    def __init__(self, prefix: str, code: int, message: str):
        super().__init__(f'{prefix} ({code}): {message}')
        self.code = code


class RegistrationTimeout(Exception):
    pass


class SignatureInvalidException(Exception):

    def __init__(self):
        super().__init__("Invalid signature")
        self.code = HTTPStatus.BAD_REQUEST
