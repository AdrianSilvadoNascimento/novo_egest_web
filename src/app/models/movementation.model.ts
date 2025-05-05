import { AccountModel } from "./account.model";
import { AccountUserModel } from "./account_user.model";
import { ItemModel } from "./item.model";

export class MovementationModel {
  id!: string
  move_type!: string;
  quantity!: number;
  item_id!: string;
  item!: ItemModel;
  account_id!: string;
  account!: AccountModel;
  account_user_id!: string;
  account_user!: AccountUserModel;
}