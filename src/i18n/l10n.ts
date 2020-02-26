export interface IDynamicValueDictionary { [key: string]: string };

export interface ILocalizableContent {
  key: string;
  keyNamespace?: string | null;
  value: string;
  dynamicValueDictionary?: IDynamicValueDictionary;
}

export type LocalizeMethod = (content: ILocalizableContent) => string;

export class LocalizationNamespaces {
  public static System: string = 'system';
  public static Notifications: string = 'notifications';
  public static UIComponents: string = 'uicomponents';
}
