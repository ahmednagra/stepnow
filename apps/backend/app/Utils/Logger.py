# apps/backend/app/Utils/Logger.py
import logging
import sys
from logging.handlers import RotatingFileHandler
from pathlib import Path
from config.settings import settings

_LOG_DIR = Path("logs")
_LOG_DIR.mkdir(exist_ok=True)
_FORMAT = "%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"
_configured: set[str] = set()


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if name in _configured:
        return logger
    logger.setLevel(settings.LOG_LEVEL)
    logger.propagate = False
    formatter = logging.Formatter(_FORMAT, datefmt=_DATE_FORMAT)
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    logger.addHandler(console)
    file_handler = RotatingFileHandler(_LOG_DIR / "app.log", maxBytes=10 * 1024 * 1024, backupCount=10, encoding="utf-8")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    _configured.add(name)
    return logger
