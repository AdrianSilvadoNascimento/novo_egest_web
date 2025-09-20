import { UnitOfMeasureModel } from './unit-of-measure.model';

export interface ProductSettingsUnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
  active: boolean;
  lowStockThreshold: number;
}

export class ProductSettingsModel {
  id?: string;
  account_id!: string;
  unitsOfMeasure!: ProductSettingsUnitOfMeasure[];
  autoGenerateBarcode!: boolean;
  descriptionRequired!: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class ProductSettingsCreationModel {
  unitsOfMeasure!: ProductSettingsUnitOfMeasure[];
  autoGenerateBarcode!: boolean;
  descriptionRequired!: boolean;
}
