export class AccountUserModel {
  id!: string;
  name!: string;
  lastname!: string;
  email!: string;
  user_image!: string;
  phone_number!: string;
  confirm_password!: string;
  address!: string;
  city!: string;
  state!: string;
  country!: string;
  zip_code!: string;
  created_at!: Date;
  updated_at!: Date;

  constructor() {
    this.id = '';
    this.name = '';
    this.lastname = '';
    this.email = '';
    this.user_image = '';
    this.phone_number = '';
    this.address = '';
    this.city = '';
    this.state = '';
    this.country = '';
    this.zip_code = '';
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}
