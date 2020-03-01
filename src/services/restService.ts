import { IService, Service } from './abstractions';
import { IResponse, ResponseStateEnumeration } from './../communication';
import { LocalizationNamespaces } from './../i18n';

export interface IRESTService extends IService {
  get: <T>(url: string) => Promise<IResponse<T>>;
  post: <T>(url: string, data: Object | string) => Promise<IResponse<T>>;
  put: <T>(url: string, data: Object | string) => Promise<IResponse<T>>;
  delete: <T>(url: string, data?: Object | number) => Promise<IResponse<T>>;
}

export class RESTService extends Service implements IRESTService {

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

  public get = <T>(url: string): Promise<IResponse<T>> => {
    return this.invokeAsync<T>('GET', url);
  };

  public post = <T>(url: string, data: Object | string): Promise<IResponse<T>> => {
    return this.invokeAsync<T>('POST', url, data);
  };

  public put = <T>(url: string, data: Object | string): Promise<IResponse<T>> => {
    return this.invokeAsync<T>('PUT', url, data);
  };

  public delete = <T>(url: string, data?: Object | number): Promise<IResponse<T>> => {
    return this.invokeAsync<T>('DELETE', url, data);
  };

  private getHeaders = (data?: Object | number | string) => {

    var headers = new Headers();

    // We only accept json as payload
    headers.set('Accept', 'application/json');

    // We use bearer tokens as authorization so we can access OAuth 2.0-protected resources
    headers.set('Authorization', `Bearer ${this.authenticationToken}`);

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

    var body = '';

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

  private invokeAsync = async <T>(method: string, url: string, data?: Object | number | string): Promise<IResponse<T>> => {

    var responseOk = false;
    var responseStatus = 0;
    var responseStatusText = '';
    var headers = this.getHeaders(data);
    var body = this.getBody(data);

    this.logger.debug(`REST request '${method}' has started on url ${url}.`);

    return fetch(url, {
      method: method,               // *GET, POST, PUT, DELETE, etc.
      mode: "same-origin",          // no-cors, cors, *same-origin
      cache: "default",             // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin",   // include, *same-origin, omit
      headers: headers,
      redirect: "follow",           // manual, *follow, error
      referrer: "client",           // no-referrer, *client
      body: body,                   // body data type must match "Content-Type" header
    }).then((response: Response) => {

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

      this.logger.debug(`REST request '${method}' has returned on url ${url}. [${responseStatus}, ${responseStatusText}]`);

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

        var displayKey = "services.restservice.responseisstring";
        var displayValue = `Response is a string and currently not supported.`;
        var logMessage = `${displayValue}`;

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
      else if (typeof responseObject == 'object') {

        var apiResponseData = responseObject as IResponse<T>;
        if (apiResponseData !== null) {

          responseData.state = apiResponseData.state ? apiResponseData.state : responseData.state;
          responseData.messageStack = apiResponseData.messageStack ? apiResponseData.messageStack : responseData.messageStack;
          responseData.payload = apiResponseData.payload;
        }
        else {

          var displayKey = "services.restservice.responseiswrongobject";
          var displayValue = `Response is a object but nof type 'IResponse<T>' and not supported.`;
          var logMessage = `${displayValue}`;

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
}
