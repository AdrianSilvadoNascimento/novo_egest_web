import { AccountSettingsModel } from "./account_settings.model";

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
  }
}
