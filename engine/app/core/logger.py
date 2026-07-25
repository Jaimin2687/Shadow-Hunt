import logging
from pythonjsonlogger import jsonlogger

class RedactingJsonFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super(RedactingJsonFormatter, self).add_fields(log_record, record, message_dict)
        
        sensitive_keys = ['x-api-key', 'password', 'token', 'secret', 'provided_key', 'api_key']
        
        for key in sensitive_keys:
            if key in log_record:
                log_record[key] = '[REDACTED]'
            
            if 'context' in log_record and isinstance(log_record['context'], dict):
                if key in log_record['context']:
                    log_record['context'][key] = '[REDACTED]'

def setup_logger():
    logger = logging.getLogger("engine")
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = RedactingJsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger

logger = setup_logger()
