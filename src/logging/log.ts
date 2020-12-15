import { LogProvider } from './LogProvider';

export enum LogLevelEnumeration {
  Info,
  UserAction,
  Debug,
  Warning,
  Error,
}

export interface ILog {
  message: string;
  context: string;
  prefix: string;
  loggerKey: string;
  level: LogLevelEnumeration;
  timeStamp: number;
}

export interface ILogger {
  key: string;
  prefix: string;
  isActive: boolean;
  isDebugLogActive: boolean;
  info: (message: string, context?: string) => void;
  userAction: (message: string, context?: string) => void;
  debug: (message: string, context?: string) => void;
  warning: (message: string, context?: string) => void;
  error: (message: string, context?: string) => void;
}

export class Logger implements ILogger {

  // ILogger
  public key: string;
  public prefix: string;
  public isActive: boolean;
  public isDebugLogActive: boolean;

  constructor(key: string, prefix: string) {

    this.key = key;
    this.prefix = prefix;
    this.isActive = true;
    this.isDebugLogActive = false;
  }

  public info = (message: string, context?: string) => {

    if (!this.isActive)
      return;

    var log: ILog = {
      message: message,
      context: context ? context : this.key,
      prefix: this.prefix,
      loggerKey: this.key,
      level: LogLevelEnumeration.Info,
      timeStamp: Date.now()
    }

    this.archiveLog(log);
  };

  public userAction = (message: string, context?: string) => {

    if (!this.isActive)
      return;

    var log: ILog = {
      message: message,
      context: context ? context : this.key,
      prefix: this.prefix,
      loggerKey: this.key,
      level: LogLevelEnumeration.UserAction,
      timeStamp: Date.now()
    }

    this.archiveLog(log);
  };

  public debug = (message: string, context?: string) => {

    if (!this.isActive)
      return;

    if (!this.isDebugLogActive)
      return;

    var log: ILog = {
      message: message,
      context: context ? context : this.key,
      prefix: this.prefix,
      loggerKey: this.key,
      level: LogLevelEnumeration.Debug,
      timeStamp: Date.now()
    }

    this.archiveLog(log);
  };

  public warning = (message: string, context?: string) => {

    if (!this.isActive)
      return;

    var log: ILog = {
      message: message,
      context: context ? context : this.key,
      prefix: this.prefix,
      loggerKey: this.key,
      level: LogLevelEnumeration.Warning,
      timeStamp: Date.now()
    }

    this.archiveLog(log);
  };

  public error = (message: string, context?: string) => {

    if (!this.isActive)
      return;

    var log: ILog = {
      message: message,
      context: context ? context : this.key,
      prefix: this.prefix,
      loggerKey: this.key,
      level: LogLevelEnumeration.Error,
      timeStamp: Date.now()
    }

    this.archiveLog(log);
  };

  private archiveLog = (log: ILog) => {

    // Archive log in provider
    LogProvider.archiveLog(log);
  };
}
