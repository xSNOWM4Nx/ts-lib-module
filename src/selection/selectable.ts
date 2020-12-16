import { ILocalizableContent } from './../i18n';

export interface ISelectableBase {
  display: ILocalizableContent;
  description?: ILocalizableContent;
  key: string;
  isVisible?: boolean;
};

export interface ISelectableValue<T> extends ISelectableBase {
  value: T;
};
