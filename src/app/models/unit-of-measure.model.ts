import { UnitOfMeasureType, UnitOfMeasureAbbreviation } from '../enums/unit-of-measure.enum';

export class UnitOfMeasureModel {
  id!: string;
  name!: UnitOfMeasureType;
  abbreviation?: UnitOfMeasureAbbreviation;
  active!: boolean;
  low_stock_threshold!: number;
  account_id!: string;
  created_at!: Date;
  updated_at?: Date;
}
