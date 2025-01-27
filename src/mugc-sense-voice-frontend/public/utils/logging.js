export class Logger {
    constructor(logLevel = 0) {
        this.logLevel = 0;
        this.setLogLevel(logLevel);
    }
    getLogLevel() {
        return this.logLevel;
    }
    setLogLevel(level) {
        if (typeof level != "number")
            return;
        this.logLevel = level;
    }
    error(message) {
        console.error(message);
    }
    warn(message) {
        if (this.logLevel < -1)
            return;
        console.warn(message);
    }
    info(message) {
        if (this.logLevel < 0)
            return;
        console.info(message);
    }
    verbose(message) {
        if (this.logLevel < 1)
            return;
        console.debug(message);
    }
    debug(message) {
        if (this.logLevel < 3)
            return;
        console.debug(message);
    }
}
