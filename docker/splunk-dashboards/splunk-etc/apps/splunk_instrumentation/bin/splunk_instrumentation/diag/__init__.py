import uuid


def make_uuid():
    """
    Makes a UUID that's consistent with the splunkd diag endpoints,
    which enforce capitalization as well as UUID format.
    """
    return str(uuid.uuid4()).upper()
