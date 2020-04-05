import { IService, Service } from './abstractions';
import { NavigationTypeEnumeration, INavigationRequest } from './../navigation';
import { LocalizationNamespaces } from './../i18n';

export interface INavigationService extends IService {
  history: Array<INavigationRequest>;
  showView: (key: string, url?: string) => void;
  showDialog: (key: string) => void;
  onNavigationRequest: (caller: string, callbackHandler: (navigationRequest: INavigationRequest) => void) => void;
  offNavigationRequest: (caller: string, callbackHandler: (navigationRequest: INavigationRequest) => void) => void;
};

export class NavigationService extends Service implements INavigationService {

  // INavigationService
  public history: Array<INavigationRequest> = [];

  // Props
  private navigationRequestSubscribers: Array<(request: INavigationRequest) => void> = [];
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

  public showView = (key: string, url?: string) => {

    var navigationRequest: INavigationRequest = {
      key: key,
      type: NavigationTypeEnumeration.View,
      url: url,
      timeStamp: Date.now()
    };

    this.processNaviagtionRequest(navigationRequest);
  };

  public showDialog = (key: string, url?: string) => {

    var navigationRequest: INavigationRequest = {
      key: key,
      type: NavigationTypeEnumeration.Dialog,
      url: url,
      timeStamp: Date.now()
    };

    this.processNaviagtionRequest(navigationRequest);
  };

  public onNavigationRequest = (caller: string, callbackHandler: (navigationRequest: INavigationRequest) => void) => {

    // Check if the callback handler is already registred, otherwise it will be added
    var index = this.navigationRequestSubscribers.indexOf(callbackHandler);
    if (index < 0)
      this.navigationRequestSubscribers.push(callbackHandler);

    this.logger.debug(`'${caller}' has registred on 'NavigationRequest'.`);
    this.logger.debug(`'${this.navigationRequestSubscribers.length}' callback handlers registred on 'NavigationRequest'.`);
  };

  public offNavigationRequest = (caller: string, callbackHandler: (navigationRequest: INavigationRequest) => void) => {

    var index = this.navigationRequestSubscribers.indexOf(callbackHandler);
    if (index >= 0)
      this.navigationRequestSubscribers.splice(index, 1);

    this.logger.debug(`'${caller}' has released on 'NavigationRequest'.`);
    this.logger.debug(`'${this.navigationRequestSubscribers.length}' callback handlers registred on 'NavigationRequest'.`);
  };

  private processNaviagtionRequest = (navigationRequest: INavigationRequest) => {

    // Execute callbacks
    this.navigationRequestSubscribers.forEach(callbackHandler => callbackHandler(navigationRequest));

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
