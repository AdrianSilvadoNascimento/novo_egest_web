import { CategoryModel } from "./category.model";
import { UnitOfMeasureModel } from "./unit-of-measure.model";

export class ItemModel {
  id!: string;
  name!: string;
  account_id!: string;
  account_user_id!: string | null;
  unit_price!: number;
  sale_price!: number;
  barcode!: string | null | undefined;
  quantity!: number;
  description!: string;
  active!: boolean;
  product_image!: string;

  category!: CategoryModel
  category_id!: string;

  unit_of_measure?: UnitOfMeasureModel;
  unit_of_measure_id?: string;

  created_at!: Date;
  updated_at!: Date | null;
}