export class PlanModel {
  id!: string;
  name!: string;
  service!: string;
  value!: number;
  interval!: number;
  repeats!: number;
  description!: string;
  currency!: string;
  status!: string;
  feature_list!: string[];
  features!: PlanFeaturesModel;
}

export class CheckoutModel {
  credit_card_token!: string;
}

export class CreditCardModel {
  card_number!: string;
  card_holder_name!: string;
  expiration_month!: number;
  expiration_year!: number;
  security_code!: string;
}

export interface ProductLimits {
  max_products: number;
  unlimited: boolean;
}

export interface UserLimits {
  max_users: number;
  unlimited: boolean;
}

export interface TeamFeatures {
  enabled: boolean;
  max_teams: number;
}

export interface BranchFeatures {
  enabled: boolean;
  max_branches: number;
}

export interface ApiAccess {
  enabled: boolean;
  rate_limit: number;
}

export interface ImportFeatures {
  excel_import: boolean;
  bulk_operations: boolean;
}

export interface Reporting {
  basic_reports: boolean;
  advanced_reports: boolean;
  custom_reports: boolean;
}

export interface Support {
  email_support: boolean;
  priority_support: boolean;
  phone_support: boolean;
}

export interface PlanFeaturesModel {
  product_limits: ProductLimits;
  user_limits: UserLimits;
  team_features: TeamFeatures;
  branch_features: BranchFeatures;
  api_access: ApiAccess;
  import_features: ImportFeatures;
  reporting: Reporting;
  support: Support;
}
