import winston from 'winston';

const redactKeys = ['x-api-key', 'password', 'token', 'secret', 'provided_key', 'api_key'];

const redactFormat = winston.format((info) => {
  const traverseAndRedact = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (redactKeys.includes(key.toLowerCase())) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        traverseAndRedact(obj[key]);
      }
    }
  };

  traverseAndRedact(info);
  return info;
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    redactFormat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});
