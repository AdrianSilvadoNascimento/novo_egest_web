import { AccountModel } from "./account.model";
import { AccountUserModel } from "./account_user.model";
import { ItemModel } from "./item.model";

export class MovementationModel {
  id!: string;
  move_type!: string;
  quantity!: number;
  description?: string;
  unit_price?: number;
  total_value?: number;
  sale_price?: number;
  
  // Relacionamentos
  item_id!: string;
  item?: ItemModel;
  account_id!: string;
  account?: AccountModel;
  account_user_id?: string;
  account_user?: AccountUserModel;
  customer_id?: string;
  order_id?: string;
  
  created_at!: Date;
  updated_at?: Date;
}

// Interface para paginação
export interface PaginatedMovementationModel {
  data: MovementationModel[];
  nextCursor: string | null;
  totalRecords: number;
}

// Enum para tipos de movimentação
export enum MovementationType {
  ENTRADA = 'ENTRY',
  SAIDA = 'OUT',
  TRANSFERENCIA = 'TRANSFER',
  VENDA = 'SALE',
  AJUSTE = 'ADJUST'
}

// Interface para filtros
export interface MovementationFilters {
  moveType?: string;
  itemId?: string;
  userId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  search?: string;
}