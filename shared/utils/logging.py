import logging
import json
import time
from typing import Any, Dict

class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "service": getattr(record, "service", "unknown"),
            "request_id": getattr(record, "request_id", "none")
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def setup_logger(service_name: str):
    logger = logging.getLogger(service_name)
    logger.setLevel(logging.INFO)
    
    handler = logging.StreamHandler()
    formatter = JsonFormatter()
    handler.setFormatter(formatter)
    
    logger.addHandler(handler)
    return logger
