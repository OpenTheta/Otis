
import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_DIR = path.join(__dirname, '../../../../logs');

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
    ),
    transports: [],
});

logger.add(new transports.Console({ format: format.combine(format.colorize(), format.simple()) }));

if (process.env.LOG_TO_FILE === '1') {
    logger.add(new transports.File({ filename: path.join(LOG_DIR, 'backend-error.log'), level: 'error' }));
    logger.add(new transports.File({ filename: path.join(LOG_DIR, 'backend-info.log') }));
}

export default logger;
