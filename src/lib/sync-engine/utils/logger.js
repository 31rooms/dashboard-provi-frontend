class Logger {
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

        console.log(logMessage);
        if (data) console.log(data);
    }

    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    debug(message, data) { this.log('debug', message, data); }
}

export const logger = new Logger();
