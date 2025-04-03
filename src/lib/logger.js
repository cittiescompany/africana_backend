const winston = require('winston');
const { format } = winston;

const logger = winston.createLogger({
  levels: winston.config.syslog.levels,
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf((info) => {
      return `${info.timestamp} ${info.level}: ${
        typeof info.message === 'object'
          ? JSON.stringify(info.message, null, 2)
          : info.message
      }`;
    })
  ),
  transports: [new winston.transports.Console({ level: 'debug' })],
});

module.exports = logger;
