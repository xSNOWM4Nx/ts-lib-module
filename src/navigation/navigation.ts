import { ISelectableBase } from './../selection';

export enum NavigationTypeEnumeration {
  View,
  Dialog
}

export interface INavigationElementBase extends ISelectableBase {
  importPath: string;
}

export interface INavigationRequest {
  key: string;
  type: NavigationTypeEnumeration;
  url?: string;
  timeStamp: number;
}
