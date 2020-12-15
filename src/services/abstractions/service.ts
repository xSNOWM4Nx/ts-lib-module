import { LogProvider, ILogger } from './../../logging';
import { ILocalizableContent, LocalizationNamespaces } from './../../i18n';
import { IResponse, ResponseStateEnumeration } from './../../communication';
import { IServiceProvider } from './../serviceProvider';

export interface IServiceKeySubscriptionDictionary { [key: string]: string };

export type ChangesCallbackMethod = (version: number, reason: string, serviceKey: string) => void;
interface IChangesSubscriberDictionary { [key: string]: ChangesCallbackMethod };

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
  onChanges: (contextKey: string, callbackHandler: ChangesCallbackMethod) => string;
  offChanges: (registerKey: string) => boolean;
  setDebugMode: (enabled: boolean) => void;
}

export abstract class Service implements IService {

  // IService
  public key: string;
  public display: ILocalizableContent;
  public description: ILocalizableContent;
  public state: ServiceStateEnumeration;

  // Props
  private version: number = 0;
  private changesSubscriberDictionary: IChangesSubscriberDictionary = {};
  private changesSubscriptionCounter: number = 0;
  protected logger: ILogger;
  protected serviceProvider?: IServiceProvider;
  protected isDebugModeActive: boolean = false;

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
    this.logger = LogProvider.getLogger(key);
  };

  public async start() {

    this.logger.info(`Starting '${this.key}'.`);

    // Init fields
    this.changesSubscriberDictionary = {};

    var onStartingResponse = await this.onStarting();
    if (onStartingResponse.state === ResponseStateEnumeration.OK) {

      this.logger.info(`'${this.key}' is running.`);
      this.updateState(ServiceStateEnumeration.Running);
    }
    else {

      this.logger.error(`'${this.key}' could not be started.`);
      this.updateState(ServiceStateEnumeration.Error);
    }

    return onStartingResponse;
  };

  public async stop() {

    this.logger.info(`Stopping '${this.key}'.`);

    var onStoppingResponse = await this.onStopping();
    if (onStoppingResponse.state === ResponseStateEnumeration.OK) {

      this.logger.info(`'${this.key}' is stopped.`);
      this.updateState(ServiceStateEnumeration.Stopped);
    }
    else {

      this.logger.error(`'${this.key}' could not be stopped.`);
      this.updateState(ServiceStateEnumeration.Error);
    }

    // Dispose fields
    this.changesSubscriberDictionary = {};

    return onStoppingResponse;
  };

  public onChanges = (contextKey: string, callbackHandler: ChangesCallbackMethod) => {

    // Setup register key
    this.changesSubscriptionCounter++;
    const registerKey = `${contextKey}_${this.changesSubscriptionCounter}`

    // Register callback
    this.changesSubscriberDictionary[registerKey] = callbackHandler;
    this.logger.debug(`Component with key '${registerKey}' has subscribed on 'Changes'.`);
    this.logger.debug(`'${Object.entries(this.changesSubscriberDictionary).length}' subscribers on 'Changes'.`);

    // Execute the callback to update the handler immediately
    callbackHandler(this.version, 'Subscription successfully', this.key);

    return registerKey;
  };

  public offChanges = (registerKey: string) => {

    // Delete callback
    var existingSubscriber = Object.entries(this.changesSubscriberDictionary).find(([key, value]) => key === registerKey);
    if (existingSubscriber) {

      delete this.changesSubscriberDictionary[registerKey];
      this.logger.debug(`Component with key '${registerKey}' has unsubscribed on 'Changes'.`);
      this.logger.debug(`'${Object.entries(this.changesSubscriberDictionary).length}' subscribers on 'Changes'.`);

      return true;
    }
    else {

      this.logger.error(`Component with key '${registerKey}' not registered on 'Changes'.`);
      this.logger.debug(`'${Object.entries(this.changesSubscriberDictionary).length}' subscribers on 'Changes'.`);

      return false;
    }
  };

  public injectServiceProvider = (serviceProvider: IServiceProvider) => {
    this.serviceProvider = serviceProvider;
  };

  public setDebugMode = (enabled: boolean) => {
    this.isDebugModeActive = enabled;
  };

  protected abstract onStopping(): Promise<IResponse<boolean>>;

  protected abstract onStarting(): Promise<IResponse<boolean>>;

  protected updateState = (state: ServiceStateEnumeration) => {

    this.state = state;
    this.updateVersion(`State changed to '${ServiceStateEnumeration[this.state]}'.`);
  };

  protected updateVersion = (reason: string) => {

    this.version++;
    this.logger.debug(`Version has been updated to '${this.version}'. ${reason}`);

    // Execute callbacks
    Object.entries(this.changesSubscriberDictionary).forEach(([key, value], index) => value(this.version, reason, this.key));
  };
};
