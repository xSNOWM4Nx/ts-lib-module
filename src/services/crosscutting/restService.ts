import { IService, Service } from '../abstractions';
import { IResponse, createResponse, ResponseStateEnumeration } from '../../communication';
import { LocalizationNamespaces } from '../../i18n';

export interface IRESTService extends IService {
  get: <T>(url: string, init?: RequestInit) => Promise<IResponse<T>>;
  post: <T>(url: string, data: Object | string, init?: RequestInit) => Promise<IResponse<T>>;
  put: <T>(url: string, data: Object | string, init?: RequestInit) => Promise<IResponse<T>>;
  delete: <T>(url: string, data?: Object | number, init?: RequestInit) => Promise<IResponse<T>>;
  setAuthorization: (authorizationHeader: string) => void;
};

export class RESTService extends Service implements IRESTService {

  // Props
  private authorizationHeader: string = '';

  constructor(key: string) {
    super(key);

    this.display = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'services.restservice.display',
      value: 'REST Service'
    };

    this.description = {
      keyNamespace: LocalizationNamespaces.System,
      key: 'services.restservice.description',
      value: 'Provides all interaction options for REST communication.'
    };
  };

  public get = <T>(url: string, init?: RequestInit): Promise<IResponse<T>> => {
    return this.invokeAsync<T>('GET', url, undefined, init);
  };

  public post = <T>(url: string, data: Object | string, init?: RequestInit): Promise<IResponse<T>> => {
    return this.invokeAsync<T>('POST', url, data, init);
  };

  public put = <T>(url: string, data: Object | string, init?: RequestInit): Promise<IResponse<T>> => {
    return this.invokeAsync<T>('PUT', url, data, init);
  };

  public delete = <T>(url: string, data?: Object | number, init?: RequestInit): Promise<IResponse<T>> => {
    return this.invokeAsync<T>('DELETE', url, data, init);
  };

  public setAuthorization = (authorizationHeader: string) => {

    this.authorizationHeader = authorizationHeader;
  };

  protected async onStarting(): Promise<IResponse<boolean>> {
    return createResponse<boolean>(true, ResponseStateEnumeration.OK, []);
  };

  protected async onStopping(): Promise<IResponse<boolean>> {
    return createResponse<boolean>(true, ResponseStateEnumeration.OK, []);
  };

  private getHeaders = (data?: Object | number | string) => {

    var headers = new Headers();

    // We only accept json as payload
    headers.set('Accept', 'application/json');

    // We can use diffrent authorizations. `Bearer TOKEN`, `Basic USERNAME:PASSWORD`, etc.
    if (this.authorizationHeader !== '')
      headers.set('Authorization', this.authorizationHeader);

    // We define the type of the content by the data type
    if (data) {
      if ((typeof data === 'object')) {
        headers.set('Content-Type', 'application/json');
      }
      else {
        headers.set('Content-Type', 'application/x-www-form-urlencoded');
      }
    }

    return headers;
  };

  private getBody = (data?: Object | number | string) => {

    var body = undefined;

    // Body data type must match "Content-Type" header
    if (data) {
      if ((typeof data === 'object')) {
        body = JSON.stringify(data);
      }
      else {
        body = String(data);
      }
    }

    return body;
  };

  private getRequestInit = (init?: RequestInit) => {

    var requestInit: RequestInit = {
      mode: "same-origin",          // no-cors, cors, *same-origin
      cache: "default",             // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin",   // include, *same-origin, omit
      redirect: "follow",           // manual, *follow, error
      referrer: "client",
    }

    if (init) {

      if (init.mode)
        requestInit.mode = init.mode;

      if (init.credentials)
        requestInit.credentials = init.credentials;
    }

    return requestInit;
  };

  private invokeAsync = async <T>(method: string, url: string, data?: Object | number | string, init?: RequestInit): Promise<IResponse<T>> => {

    var responseOk = false;
    var responseStatus = 0;
    var responseStatusText = '';

    var requestInit = this.getRequestInit(init);
    var headers = this.getHeaders(data);
    var body = this.getBody(data);
    requestInit.headers = headers;
    requestInit.body = body;

    if (this.isDebugModeActive)
      this.logger.info(`REST request '${method}' has started on url ${url}.`);

    return fetch(url, requestInit)
      .then((response: Response) => {

        // Save the response state
        responseOk = response.ok;
        responseStatus = response.status;
        responseStatusText = response.statusText;

        // Check how to resolve the body
        var responseContentType = response.headers.get("content-type");
        if (responseContentType && responseContentType.indexOf("application/json") !== -1)
          return response.json();
        else
          return response.text();

      }).then((responseObject) => {

        // Setup the response object
        var responseData: IResponse<T> = {
          state: ResponseStateEnumeration.Unknown,
          messageStack: []
        }

        if (this.isDebugModeActive)
          this.logger.info(`REST request '${method}' has returned from url ${url}. [${responseStatus}, ${responseStatusText}]`);

        if (responseObject == null ||
          responseObject == undefined) {

          var displayKey = "services.restservice.novalidresponse";
          var displayValue = `No valid response.`;
          var logMessage = `${displayValue} Response object is null or undefined.`;

          responseData.messageStack.push({
            display: {
              keyNamespace: LocalizationNamespaces.System,
              key: displayKey,
              value: displayValue,
            },
            context: this.key,
            logText: logMessage
          })

          this.logger.error(logMessage);
        }
        else if (typeof responseObject == 'string') {

          var payload: any = {
            data: responseObject
          }

          responseData.state = ResponseStateEnumeration.OK;
          responseData.payload = payload;
        }
        else if (typeof responseObject == 'object') {

          var assertedResponseData = responseObject as IResponse<T>;
          if (assertedResponseData.state && assertedResponseData.messageStack && assertedResponseData.payload) {

            responseData.state = assertedResponseData.state;
            responseData.messageStack = assertedResponseData.messageStack;
            responseData.payload = assertedResponseData.payload;
          }
          else {

            responseData.state = ResponseStateEnumeration.OK;
            responseData.payload = responseObject;
          }
        }
        else {

          var displayKey = "services.restservice.noresponse";
          var displayValue = `No response available.`;
          var logMessage = `${displayValue} No idea what's going on here. Go and drink a coffee.`;

          responseData.messageStack.push({
            display: {
              key: displayKey,
              keyNamespace: LocalizationNamespaces.System,
              value: displayValue,
            },
            context: this.key,
            logText: logMessage
          })

          this.logger.error(logMessage);
        }

        // Fill the response object
        var response: IResponse<T> = {
          state: responseData.state,
          messageStack: responseData.messageStack,
          payload: responseData.payload,
        };

        return response;
      });

  };
};
