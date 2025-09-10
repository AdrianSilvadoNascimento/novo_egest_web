import { AccountSettingsModel } from "./account_settings.model";
import { AccountUserType } from "./account_user.model";
import { PlanFeaturesModel, PlanModel } from "./plan.model";

export class AccountModel {
  id!: string;
  name!: string;
  email!: string;
  phone_number!: string;
  cpf_cnpj!: string;
  birth!: string;
  created_at!: Date;
  updated_at!: Date;
  settings!: AccountSettingsModel;
  card!: AccountCardModel;
  is_trial!: boolean;
  is_assinant!: boolean;
  type!: AccountUserType;
  subscription_plan!: number;
  subscription_id!: number;
  expiration_trial!: Date;
  subscription!: SubscriptionModel;
  plan_features!: PlanFeaturesModel;
  plan!: PlanModel;

  constructor() {
    this.id = '';
    this.name = '';
    this.email = '';
    this.phone_number = '';
    this.cpf_cnpj = '';
    this.birth = '';
    this.created_at = new Date();
    this.updated_at = new Date();
    this.settings = new AccountSettingsModel();
    this.card = new AccountCardModel();
  }
}

export class AccountCardModel {
  id!: string;
  card_token!: string;
  card_mask!: string;
  expiration_date!: Date;
  brand!: string;
  customer_document!: string;
  created_at!: Date;
  updated_at!: Date;
}

export class SubscriptionModel {
  id!: string;
  plan_id!: string;
  account_id!: string;
  account_user_id!: string;
  credit_card_token!: string;
  card_mask!: string;
  expiration_date!: string;
  brand!: string;
  holder_document!: string;
  created_at!: Date;
  updated_at!: Date;
  canceled_at!: Date;
  status!: string;
  is_expired!: boolean;
  next_renewal!: Date;
  next_execution!: Date;
  efi_subscription_id!: string;
  payment_history!: SubscriptionPaymentHistoryModel[];
  card!: AccountCardModel;
  plan!: PlanModel;
}

export class SubscriptionPaymentHistoryModel {
  id!: string;
  total!: number;
  status!: string;
  created_at!: Date;
}
