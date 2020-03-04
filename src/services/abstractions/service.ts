import { LogProvider, ILogger } from './../../logging';
import { ILocalizableContent, LocalizationNamespaces } from './../../i18n';
import { IResponse, ResponseStateEnumeration, createResponse } from './../../communication';

export enum ServiceStateEnumeration {
  Unknown,
  Initialized,
  Running,
  Stopped,
  Error
}

export interface IService {
  key: string;
  state: ServiceStateEnumeration;
  display: ILocalizableContent;
  description: ILocalizableContent;
  start: () => Promise<IResponse<boolean>>;
  stop: () => Promise<IResponse<boolean>>;
  setAuthenticationToken: (token: string) => void;
  onChanges: (caller: string, callbackHandler: (version: number, reason: string, serviceKey: string) => void) => IResponse<boolean>;
  offChanges: (caller: string, callbackHandler: (version: number, reason: string, serviceKey: string) => void) => IResponse<boolean>;
}

export abstract class Service implements IService {

  // IService
  public key: string;
  public display: ILocalizableContent;
  public description: ILocalizableContent;
  public state: ServiceStateEnumeration;

  // Props
  private version: number;
  private onChangesSubscribers: Array<(version: number, reason: string, serviceKey: string) => void>;
  protected logger: ILogger;
  protected authenticationToken: string;

  constructor(key: string) {

    this.key = key;

    this.display = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'global.nodisplaydefined',
      value: 'Service?'
    };

    this.description = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'global.nodescriptiondefined',
      value: 'Description?'
    };

    this.state = ServiceStateEnumeration.Unknown;
    this.version = 0;

    this.onChangesSubscribers = [];
    this.logger = LogProvider.getLogger(key);
    this.authenticationToken = '';
  };

  public async start() {

    // Init fields
    this.onChangesSubscribers = [];

    this.logger.info(`'${this.key}' is running.`);
    this.updateState(ServiceStateEnumeration.Running);

    return createResponse<boolean>(true);
  };

  public async stop() {

    // Dispose fields
    this.onChangesSubscribers = [];

    this.logger.info(`${this.key} has stopped.`);
    this.updateState(ServiceStateEnumeration.Stopped);

    return createResponse<boolean>(true);
  };

  public setAuthenticationToken(token: string) {

    this.logger.info(`A new authentication token was transferred.`);
    this.authenticationToken = token;
  };

  public onChanges = (caller: string, callbackHandler: (version: number, reason: string, serviceKey: string) => void) => {

    // Check if the callback handler is already registred, otherwise it will be added
    var index = this.onChangesSubscribers.indexOf(callbackHandler);
    if (index < 0)
      this.onChangesSubscribers.push(callbackHandler);

    this.logger.debug(`'${caller}' has subscribed for 'Changes'.`);
    this.logger.debug(`'${this.onChangesSubscribers.length}' subscribers for 'Changes'.`);

    // Execute the callback to update the handler immediately
    callbackHandler(this.version, 'Successfully registred', this.key);

    return createResponse<boolean>(true);
  };

  public offChanges = (caller: string, callbackHandler: (version: number, reason: string, serviceKey: string) => void) => {

    var index = this.onChangesSubscribers.indexOf(callbackHandler);
    if (index >= 0)
      this.onChangesSubscribers.splice(index, 1);

    this.logger.debug(`'${caller}' has unsubscribed for 'Changes'.`);
    this.logger.debug(`'${this.onChangesSubscribers.length}' subscribers for 'Changes'.`);

    return createResponse<boolean>(true);
  };

  protected updateState = (state: ServiceStateEnumeration) => {

    this.state = state;
    this.updateVersion(`State changed to '${ServiceStateEnumeration[this.state]}'.`);
  };

  protected updateVersion = (reason: string) => {

    this.version++;
    this.logger.debug(`Version has been updated to '${this.version}'. ${reason}`);

    // Execute callbacks
    this.onChangesSubscribers.forEach(callbackHandler => callbackHandler(this.version, reason, this.key));
  };
}
