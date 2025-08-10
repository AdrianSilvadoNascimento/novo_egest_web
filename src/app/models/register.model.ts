export class RegisterModel {
  name!: string;
  email!: string;
  password!: string;
  password_confirmation!: string;
  business_name?: string;
  terms!: boolean;
}
