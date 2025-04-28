export class ItemCreationModel {
  name!: string;
  category!: string;
  unit_price!: number;
  sale_price!: number;
  product_image!: string;
  barcode!: string | null | undefined;
  quantity!: number;
  description!: string;
  active!: boolean;
}