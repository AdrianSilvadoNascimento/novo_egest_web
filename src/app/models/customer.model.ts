import { AccountModel } from "./account.model";
import { AccountAddressModel } from "./account_address.model";

export class CustomerModel {
  id!: string;
  name!: string;
  lastname!: string;
  age!: number;
  email!: string;
  gender!: string;
  type!: 'PERSON' | 'BUSINESS';
  phone?: string;
  document!: string;
  account_id!: string;
  account!: AccountModel;
  active?: boolean;
  deactivated_at?: Date | null;
  created_at!: Date;
  updated_at!: Date;
  address?: AccountAddressModel;
  summary?: {
    customer_id: string;
    last_order: {
      id: string;
      order_total: number;
      created_at: Date;
      items_count: number;
    } | null;
    total_spent: number;
    total_items_purchased: number;
    total_orders: number;
  };
}

export class PaginatedCustomersModel {
  data!: CustomerModel[];
  nextCursor!: string | null;
  totalRecords!: number;
}
