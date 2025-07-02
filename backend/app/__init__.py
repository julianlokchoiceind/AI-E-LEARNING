# Suppress Pydantic warnings at import time
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="pydantic._internal._config")