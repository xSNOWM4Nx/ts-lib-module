import { ILogger, Logger, ILog, LogLevelEnumeration } from './log';

export class LogProvider {

  // Props
  public static loggers: Array<ILogger> = [];
  public static archive: Array<ILog> = [];
  public static archiveOverflowLimit: number = 5000;
  public static defaultPrefix: string = 'WEB';
  public static isDebugLogActive: boolean = false;
  public static isConsoleLoggingActive: boolean = true;

  private static version: number = 0;
  private static onChangesSubscribers: Array<(version: number, reason: string) => void> = [];

  public static getLogger = (key: string, prefix?: string) => {

    var logger = LogProvider.loggers.find(l => l.key === key);
    if (logger) {

      logger.isDebugLogActive = LogProvider.isDebugLogActive;
      return logger;
    }

    logger = LogProvider.createLogger(key, prefix);
    logger.isDebugLogActive = LogProvider.isDebugLogActive;

    return logger;
  };

  public static archiveLog = (log: ILog) => {

    LogProvider.archive.unshift(log);

    if (LogProvider.archive.length > LogProvider.archiveOverflowLimit)
      LogProvider.archive.pop();

    // Increase version
    LogProvider.updateVersion(`New log entry received.`);

    if (LogProvider.isConsoleLoggingActive) {

      switch (log.level) {
        case LogLevelEnumeration.Debug:
          console.debug(`${log.prefix} | ${log.loggerKey} | ${log.message}`);
          break;
        case LogLevelEnumeration.Error:
          console.error(`${log.prefix} | ${log.loggerKey} | ${log.message}`);
          break;
        case LogLevelEnumeration.Info:
          console.info(`${log.prefix} | ${log.loggerKey} | ${log.message}`);
          break;
        case LogLevelEnumeration.Warning:
          console.warn(`${log.prefix} | ${log.loggerKey} | ${log.message}`);
          break;
      }
    }
  };

  public static setDebugLog = (isActive: boolean, key?: string) => {

    if (!key) {

      LogProvider.isDebugLogActive = isActive;
      LogProvider.loggers.forEach(logger => logger.isDebugLogActive = isActive);

      // Increase version
      LogProvider.updateVersion(`Debug logging changed for all loggers.`);
      return;
    }

    var logger = LogProvider.loggers.find(logger => logger.key === key);
    if (logger)
      logger.isDebugLogActive = isActive;

    // Increase version
    LogProvider.updateVersion(`Debug logging changed for logger '${key}'.`);
  };

  public static setActive = (isActive: boolean, key?: string) => {

    if (!key) {

      LogProvider.loggers.forEach(logger => logger.isActive = isActive);

      // Increase version
      LogProvider.updateVersion(`Activation changed for all loggers.`);
      return;
    }

    var logger = LogProvider.loggers.find(logger => logger.key === key);
    if (logger)
      logger.isActive = isActive;

    // Increase version
    LogProvider.updateVersion(`Activation changed for logger '${key}'.`);
  };

  public static clearArchive = () => {

    // Clear main archive
    LogProvider.archive = [];

    // Increase version
    LogProvider.updateVersion(`All logs cleared.`);
  };

  public static onChanges = (callbackHandler: (version: number, reason: string) => void) => {

    // Check if the callback handler is already registred, otherwise it will be added
    var index = LogProvider.onChangesSubscribers.indexOf(callbackHandler);
    if (index < 0)
      LogProvider.onChangesSubscribers.push(callbackHandler);

    // Execute the callback to update the handler immediately
    callbackHandler(LogProvider.version, 'Successfully registred');
  };

  public static offChanges = (callbackHandler: (version: number, reason: string) => void) => {

    var index = LogProvider.onChangesSubscribers.indexOf(callbackHandler);
    if (index >= 0)
      LogProvider.onChangesSubscribers.splice(index, 1);
  };

  public static updateVersion = (reason: string) => {

    LogProvider.version++;

    // Execute callbacks
    LogProvider.onChangesSubscribers.forEach(callbackHandler => callbackHandler(LogProvider.version, reason));
  };

  private static createLogger = (key: string, prefix?: string) => {

    var loggerPrefix = prefix ? prefix : LogProvider.defaultPrefix;
    var logger = new Logger(key, loggerPrefix);

    LogProvider.loggers.push(logger);

    return logger;
  };
}
