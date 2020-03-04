import { IService } from './abstractions';
import { ServiceKeys } from './constants';
import { RESTService } from './restService';
import { LogProvider, ILogger } from './../logging';
import { IResponse, ResponseStateEnumeration } from './../communication';

export interface IServiceDictionary { [key: string]: IService };

export interface IServiceProvider {
  key: string;
  serviceDictionary: IServiceDictionary;
  addService: <T extends IService>(service: T, serviceKey: string) => void;
  getService: <T extends IService>(serviceKey: string) => T | undefined;
  startServices: () => Promise<boolean>;
  stopServices: () => Promise<boolean>;
  setAuthenticationToken: (token: string) => void;
}

const ServiceDictionary: IServiceDictionary = {
  [ServiceKeys.RESTService]: new RESTService(ServiceKeys.RESTService),
}

export class ServiceProvider implements IServiceProvider {

  // IServiceProvider
  public key: string;
  public serviceDictionary: IServiceDictionary;

  // Props
  private logger: ILogger;

  constructor(key: string) {

    this.key = key;
    this.serviceDictionary = ServiceDictionary;

    // Get the logger
    this.logger = LogProvider.getLogger(this.key);
  }

  public addService = <T extends IService>(service: T, serviceKey: string) => {

    // Check if the service already exists
    var dictionaryPair = Object.entries(this.serviceDictionary).find(([key, value]) => key === serviceKey);
    if (dictionaryPair)
      return;

    // Push the new service to the dictionary
    this.logger.info(`Service '${serviceKey}' added.`);
    this.serviceDictionary[serviceKey] = service;
  };

  public getService = <T extends IService>(serviceKey: string): T | undefined => {

    var dictionaryPair = Object.entries(this.serviceDictionary).find(([key, value]) => key === serviceKey);
    if (dictionaryPair)
      return dictionaryPair[1] as T;

    this.logger.error(`Service '${serviceKey}' not found.`);
    return undefined
  };

  public startServices = async () => {

    this.logger.info(`'${Object.entries(this.serviceDictionary).length}' services detected.`);
    this.logger.info(`Starting services.`);

    const serviceStartPromises: Promise<IResponse<boolean>>[] = [];
    Object.entries(this.serviceDictionary).forEach(([key, value]) => serviceStartPromises.push(value.start()));

    const serviceStartResponses = await Promise.all(serviceStartPromises);
    const failedServices = serviceStartResponses.filter(r => r.state === ResponseStateEnumeration.Error);

    if (failedServices.length > 0)
      this.logger.error(`Not all services could be started. '${failedServices.length}' services failed!`);
    else
      this.logger.info(`All services started and ready.`);

    return failedServices.length === 0;
  };

  public stopServices = async () => {

    this.logger.info(`'${Object.entries(this.serviceDictionary).length}' services detected.`);
    this.logger.info(`Stopping services.`);

    const serviceStopPromises: Promise<IResponse<boolean>>[] = [];
    Object.entries(this.serviceDictionary).forEach(([key, value]) => serviceStopPromises.push(value.stop()));

    const serviceStopResponses = await Promise.all(serviceStopPromises);
    const failedServices = serviceStopResponses.filter(r => r.state === ResponseStateEnumeration.Error);

    if (failedServices.length > 0)
      this.logger.error(`Not all services could be stopped. '${failedServices.length}' services failed!`);
    else
      this.logger.info(`All services stopped.`);

    return failedServices.length === 0;
  };

  public setAuthenticationToken = (token: string) => {

    Object.entries(this.serviceDictionary).forEach(([key, value]) => value.setAuthenticationToken(token));
  };
}
