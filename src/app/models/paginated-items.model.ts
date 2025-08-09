import { ItemModel } from "./item.model";

export class PaginatedItemsModel {
  data!: ItemModel[]
  nextCursor!: string | null;
}
