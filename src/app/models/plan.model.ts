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
