import { ILocalizableContent } from './../i18n';

export enum ResponseStateEnumeration {
  Unknown,
  OK,
  Error
}

export interface IResponseMessage {
  display: ILocalizableContent;
  context: string;
  logText?: string;
}

export interface IResponse<T> {
  state: ResponseStateEnumeration;
  messageStack: IResponseMessage[];
  payload?: T;
};

export const createResponse = <T>(payload: T, state: ResponseStateEnumeration = ResponseStateEnumeration.OK, messageStack: IResponseMessage[] = []) => {

  var response: IResponse<T> = {
    state: state,
    messageStack: messageStack,
    payload: payload
  }

  return response;
}
