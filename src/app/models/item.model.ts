export class ItemModel {
  id!: string;
  name!: string;
  account_id!: string;
  account_user_id!: string | null;
  category!: string;
  unit_price!: number;
  sale_price!: number;
  barcode!: string | null | undefined;
  quantity!: number;
  product_image!: string;

  created_at!: Date;
  updated_at!: Date | null;
}