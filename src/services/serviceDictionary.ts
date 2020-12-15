import { IService } from './abstractions';
import { ServiceKeys } from './serviceKeys';
import { NavigationService } from './crosscutting/navigationService';
import { RESTService } from './crosscutting/restService';

export interface IServiceDictionary { [key: string]: IService };

export const ServiceDictionary: IServiceDictionary = {
  [ServiceKeys.NavigationService]: new NavigationService(ServiceKeys.NavigationService),
  [ServiceKeys.RESTService]: new RESTService(ServiceKeys.RESTService),
};
