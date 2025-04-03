from constants import DEFAULT_PREFIX_INDEX_NAME, DEFAULT_SUFFIX_INDEX_NAME

class Generate():
    """
    This class is responsible for generating sample data.
    """

    def index_name(self, name: str) -> str:
        """
        This method generates the index name for the sample data.
        """
        return f'{DEFAULT_PREFIX_INDEX_NAME}{name}{DEFAULT_SUFFIX_INDEX_NAME}'

generate = Generate()