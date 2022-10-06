import { IService, Service } from '../abstractions';
import { IResponse, createResponse, ResponseStateEnumeration } from './../../communication';
import { INavigationElementBase, NavigationTypeEnumeration, INavigationRequest } from '../../navigation';
import { LocalizationNamespaces } from '../../i18n';

export type NavigationRequestCallbackMethod = (navigationRequest: INavigationRequest) => void;
interface INavigationRequestSubscriberDictionary { [key: string]: NavigationRequestCallbackMethod };

export interface INavigationService extends IService {
  history: Array<INavigationRequest>;
  show: (navigationData: INavigationElementBase, url?: string) => void;
  onNavigationRequest: (contextKey: string, callbackHandler: NavigationRequestCallbackMethod) => string;
  offNavigationRequest: (registerKey: string) => boolean;
};

export class NavigationService extends Service implements INavigationService {

  // INavigationService
  public history: Array<INavigationRequest> = [];

  // Props
  private navigationRequestSubscriberDictionary: INavigationRequestSubscriberDictionary = {};
  private navigationRequestSubscriptionCounter: number = 0;
  private historyOverflowLimit: number = 2000;

  constructor(key: string) {
    super(key);

    this.display = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'services.navigationservice.display',
      value: 'Navigation Service'
    };

    this.description = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'services.navigationservice.description',
      value: 'Provides all interaction options for UI navigation.'
    };
  };

  public show = (navigationData: INavigationElementBase, url?: string) => {

    var navigationRequest: INavigationRequest = {
      key: navigationData.key,
      type: navigationData.type ? navigationData.type : NavigationTypeEnumeration.View,
      url: url,
      timeStamp: Date.now()
    };

    this.processNaviagtionRequest(navigationRequest);
  };

  public onNavigationRequest = (contextKey: string, callbackHandler: NavigationRequestCallbackMethod) => {

    // Setup register key
    this.navigationRequestSubscriptionCounter++;
    const registerKey = `${contextKey}_${this.navigationRequestSubscriptionCounter}`

    // Register callback
    this.navigationRequestSubscriberDictionary[registerKey] = callbackHandler;
    this.logger.debug(`Component with key '${registerKey}' has subscribed on 'NavigationRequest'.`);
    this.logger.debug(`'${Object.entries(this.navigationRequestSubscriberDictionary).length}' subscribers on 'Changes'.`);

    return registerKey;
  };

  public offNavigationRequest = (registerKey: string) => {

    // Delete callback
    var existingSubscriber = Object.entries(this.navigationRequestSubscriberDictionary).find(([key, value]) => key === registerKey);
    if (existingSubscriber) {

      delete this.navigationRequestSubscriberDictionary[registerKey];
      this.logger.debug(`Component with key '${registerKey}' has unsubscribed on 'Changes'.`);
      this.logger.debug(`'${Object.entries(this.navigationRequestSubscriberDictionary).length}' subscribers on 'Changes'.`);

      return true;
    }
    else {

      this.logger.error(`Component with key '${registerKey}' not registered on 'Changes'.`);
      this.logger.debug(`'${Object.entries(this.navigationRequestSubscriberDictionary).length}' subscribers on 'Changes'.`);

      return false;
    };
  };

  protected async onStarting(): Promise<IResponse<boolean>> {
    return createResponse<boolean>(true, ResponseStateEnumeration.OK, []);
  };

  protected async onStopping(): Promise<IResponse<boolean>> {
    return createResponse<boolean>(true, ResponseStateEnumeration.OK, []);
  };

  private processNaviagtionRequest = (navigationRequest: INavigationRequest) => {

    // Execute callbacks
    Object.entries(this.navigationRequestSubscriberDictionary).forEach(([key, value], index) => value(navigationRequest));

    // Archive navigation request
    this.archiveNavigationRequest(navigationRequest);

    // Increase service version
    this.updateVersion(`Navigation requested has been added [${navigationRequest.key}, ${navigationRequest.type}]`);
  };

  private archiveNavigationRequest = (navigationRequest: INavigationRequest) => {

    // Add navigation request
    this.history.unshift(navigationRequest);

    if (this.history.length > this.historyOverflowLimit)
      this.history.pop();
  };
};
