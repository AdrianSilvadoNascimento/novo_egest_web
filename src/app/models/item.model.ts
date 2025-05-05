import { CategoryModel } from "./category.model";

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

  created_at!: Date;
  updated_at!: Date | null;
}