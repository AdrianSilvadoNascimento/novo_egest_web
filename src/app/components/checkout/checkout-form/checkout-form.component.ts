import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { CurrencyPipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { provideNgxMask } from 'ngx-mask';

import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MatCard } from "@angular/material/card";
import { MatError } from "@angular/material/form-field";
import { CreditCard, LucideAngularModule, Mail, Star, User, Lock, Rocket, ShoppingCart } from 'lucide-angular';

import { PlanModel } from '../../../models/plan.model';
import { ToastService } from '../../../services/toast.service';
import { AccountModel, SubscriptionModel } from '../../../models/account.model';
import { AccountService } from '../../../services/account.service';
import { AccountUserModel } from '../../../models/account_user.model';
import { AccountUserService } from '../../../services/account-user.service';
import { UtilsService } from '../../../services/utils/utils.service';
import { EfiService } from '../../../services/utils/efi.service';
import { CheckoutService } from '../../../services/checkout.service';
import { MatProgressSpinner } from "@angular/material/progress-spinner";

registerLocaleData(localePt);

@Component({
  selector: 'app-checkout-form',
  standalone: true,
  imports: [
    MatIcon,
    MatDialogContent,
    ReactiveFormsModule,
    MatCard,
    LucideAngularModule,
    MatError,
    CurrencyPipe,
    MatProgressSpinner
],
  templateUrl: './checkout-form.component.html',
  styleUrl: './checkout-form.component.scss',
  providers: [provideNgxMask(), {
    provide: LOCALE_ID, 
    useValue: "pt-BR"
  }],
})
export class CheckoutFormComponent implements OnInit {
  readonly creditCardIcon = CreditCard;
  readonly userIcon = User;
  readonly mailIcon = Mail;
  readonly starIcon = Star;
  readonly padlockIcon = Lock;
  readonly rocketIcon = Rocket;
  readonly cartIcon = ShoppingCart;

  form: FormGroup = new FormGroup({});
  account!: AccountModel;
  
  isLoading: boolean = false;
  cpfCnpjMask: string = '000.000.000-00';
  nextPayment: string = '';

  constructor(
    readonly dialogRef: MatDialogRef<CheckoutFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { plan: PlanModel },
    private readonly fb: FormBuilder,
    private readonly toast: ToastService,
    private readonly accountService: AccountService,
    private readonly accountUserService: AccountUserService,
    private readonly checkoutService: CheckoutService,
    private readonly efiService: EfiService,
    readonly utilsService: UtilsService
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.fetchAccount();
    this.fetchUser();

    this.efiService.checkScriptBlocking();

    this.nextPayment = this.nextPaymentDate();
  }

  /**
   * Calcula a data de próxima renovação
   * @returns Data de próxima renovação
   */
  nextPaymentDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Cria o formulário de checkout
   */
  createForm(): void {
    this.form = this.fb.group({
      holder_name: [this.account?.name || '', [Validators.required, this.validateFullName.bind(this)]],
      card_number: [null, [Validators.required, this.validateCardNumber.bind(this)]],
      expiration_month: [null, [Validators.required, this.validateExpirationMonth.bind(this)]],
      expiration_year: [null, [Validators.required, this.validateExpirationYear.bind(this)]],
      security_code: [null, [Validators.required, this.validateSecurityCode.bind(this)]],
      name: [null, [Validators.required, this.validateFullName.bind(this)]],
      email: [null, [Validators.required, Validators.email]],
      company_name: [null, [Validators.required]],
      cpf_cnpj: [null, [Validators.required, this.documentValidator.bind(this)]],
      type: [null],
      brand: [null],
    })
  }

  /**
   * Envia os dados do formulário para criação de um token
   */
  async onSubmit(): Promise<void> {
    this.isLoading = true;

    if (this.form.valid) {
      try {        
        const data = {
          card_number: this.form.get('card_number')?.value,
          holder_name: this.form.get('holder_name')?.value,
          expiration_month: this.form.get('expiration_month')?.value,
          expiration_year: this.form.get('expiration_year')?.value,
          security_code: this.form.get('security_code')?.value,
          cpf_cnpj: this.form.get('cpf_cnpj')?.value,
          brand: this.form.get('brand')?.value,
          holder_document: this.form.get('cpf_cnpj')?.value,
        }

        const generateToken = await this.efiService.generateToken(data);

        generateToken.subscribe({
          next: (response: any) => {
            const subscriptionData = {
              plan_id: this.data.plan.id,
              account_id: this.account.id,
              credit_card_token: response.token,
              card_mask: response.card_mask,
              expiration_date: `${this.form.get('expiration_month')?.value}/${this.form.get('expiration_year')?.value}`,
              brand: this.form.get('brand')?.value,
              holder_document: this.form.get('cpf_cnpj')?.value,
            }

            this.createSubscription(subscriptionData);
          },
          error: (error: any) => this.toast.error(error.message)
        });
      } catch (error: any) {
        this.toast.error(error.message || 'Erro ao processar dados do cartão');
      } finally {
        this.isLoading = false;
      }
    }
  }

  /**
   * Cria uma nova assinatura
   * @param subscritionData 
   */
  createSubscription(subscritionData: Partial<SubscriptionModel>): void {
    this.checkoutService.createSubscription(subscritionData).subscribe({
      next: () => {
        this.toast.success('Assinatura criada com sucesso');
        this.dialogRef.close(true);
      },
      error: (error: any) => this.toast.error(error.message)
    });
  }

  /**
   * Validador para número do cartão
   */
  private validateCardNumber(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const cardNumber = control.value.replace(/\D/g, '');
    
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return { invalidCardLength: true };
    }

    // Algoritmo de Luhn para validar cartão
    if (!this.luhnCheck(cardNumber)) {
      return { invalidCardNumber: true };
    }

    return null;
  }

  /**
   * Validador para mês de expiração
   */
  private validateExpirationMonth(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const month = control.value.replace(/\D/g, '');
    
    if (month.length !== 2) {
      return { invalidMonthLength: true };
    }

    const monthNum = parseInt(month);
    if (monthNum < 1 || monthNum > 12) {
      return { invalidMonthRange: true };
    }

    return null;
  }

  /**
   * Validador para ano de expiração
   */
  private validateExpirationYear(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const year = control.value.replace(/\D/g, '');
    
    if (year.length !== 4) {
      return { invalidYearLength: true };
    }

    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();
    
    if (yearNum < currentYear || yearNum > currentYear + 20) {
      return { invalidYearRange: true };
    }

    return null;
  }

  /**
   * Validador para código de segurança
   */
  private validateSecurityCode(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const code = control.value.replace(/\D/g, '');
    
    if (code.length !== 3) {
      return { invalidSecurityCodeLength: true };
    }

    return null;
  }

  /**
   * Algoritmo de Luhn para validar número do cartão
   */
  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    // Percorre o número do cartão de trás para frente
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i));

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Aplica máscara no número do cartão
   */
  onCardNumberInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    // Limita a 19 dígitos (maior cartão possível)
    if (value.length > 19) {
      value = value.substring(0, 19);
    }

    // Aplica máscara: XXXX XXXX XXXX XXXX
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }

    this.form.get('card_number')?.setValue(formattedValue, { emitEvent: false });
  }

  /**
   * Aplica máscara no mês de expiração
   */
  onExpirationMonthInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    // Limita a 2 dígitos
    if (value.length > 2) {
      value = value.substring(0, 2);
    }

    // Valida se é um mês válido
    const monthNum = parseInt(value);
    if (monthNum > 12) {
      value = '12';
    }

    this.form.get('expiration_month')?.setValue(value, { emitEvent: false });
  }

  /**
   * Aplica máscara no ano de expiração
   */
  onExpirationYearInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    // Limita a 4 dígitos
    if (value.length > 4) {
      value = value.substring(0, 4);
    }

    this.form.get('expiration_year')?.setValue(value, { emitEvent: false });
  }

  /**
   * Aplica máscara no código de segurança
   */
  onSecurityCodeInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    // Limita a 3 dígitos
    if (value.length > 3) {
      value = value.substring(0, 3);
    }

    this.form.get('security_code')?.setValue(value, { emitEvent: false });
  }

  /**
   * Sanitiza o nome do plano para retornar o ícone correspondente
   * @param planName - Nome do plano
   * @returns Ícone correspondente ao plano
   */
  sanitizeIcon(planName: string): any {
    return this.utilsService.sanitizeIcon(planName);
  }

  /**
   * Identifica a bandeira do cartão
   */
  async identifyBrand(cardNumber: string): Promise<void> {
    const brand = await this.efiService.identifyBrand(cardNumber.trim());

    brand.subscribe({
      next: (brand: string) => {
        this.form.get('brand')?.setValue(brand);
      },
      error: (error: any) => this.toast.error(error.message)
    });
  }

  /**
   * Validador customizado para verificar se o titular preencheu nome e sobrenome
   */
  private validateFullName(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const fullName = control.value.trim();

    const words = fullName.split(' ').filter((word: string) => word.length > 0);

    if (words.length < 2) return { fullNameRequired: true };

    for (const word of words) {
      if ((word as string).length < 2) return { invalidWordLength: true };
    }

    return null;
  }

  /**
   * Busca os dados do usuário
   */
  fetchUser(): void {
    this.accountUserService.getAccountUser().subscribe({
      next: (user: AccountUserModel) => {
        this.form.patchValue({
          email: user.email,
          name: user.name,
        })
      },
      error: (error: any) => this.toast.error(error.message)
    })
  }

  /**
   * Busca os dados da conta
   */
  fetchAccount(): void {
    this.accountService.getAccount().subscribe({
      next: (account: AccountModel) => {
        this.account = account;
        const cpfCnpj = account.cpf_cnpj;

        if (this.form) {
          this.form.patchValue({
            holder_name: account.name || '',
            company_name: account.name || '',
            cpf_cnpj: cpfCnpj || '',
          });
        }

        if (cpfCnpj) this.formatDocument()
      },
      error: (error: any) => this.toast.error(error.message)
    })
  }

  /**
 * Permite apenas números e limita a entrada durante a digitação
 * @param event - evento de input
 */
  onCpfCnpjInput(event: any): void {
    let value = event.target.value.replace(/\D/g, '');

    if (value.length > 14) value = value.substring(0, 14);

    if (value.length === 11)
      this.form.get('type')?.setValue('PERSON', { emitEvent: false });
    else if (value.length === 14)
      this.form.get('type')?.setValue('BUSINESS', { emitEvent: false });

    this.form.get('cpf_cnpj')?.setValue(value, { emitEvent: false });
  }

  /**
   * Formata o documento quando o usuário sai do campo
   */
  formatDocument(): void {
    const documentControl = this.form.get('cpf_cnpj');
    const value = documentControl?.value?.replace(/\D/g, '') || '';

    let formattedValue = '';

    if (value.length === 11) {
      formattedValue = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      this.form.get('type')?.setValue('PERSON', { emitEvent: false });
    } else if (value.length === 14) {
      formattedValue = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      this.form.get('type')?.setValue('BUSINESS', { emitEvent: false });
    } else {
      formattedValue = value;
    }

    documentControl?.setValue(formattedValue, { emitEvent: false });
  }

  /**
   * Valida se o documento é um CPF ou CNPJ válido
   * @param value - valor do documento
   */
  private validateDocument(value: string): boolean {
    const cleanValue = value.replace(/\D/g, '');

    if (cleanValue.length === 11) {
      return this.validateCPF(cleanValue);
    } else if (cleanValue.length === 14) {
      return this.validateCNPJ(cleanValue);
    }

    return false;
  }

  /**
   * Valida CPF
   * @param cpf - CPF sem formatação
   */
  private validateCPF(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;

    return remainder === parseInt(cpf.charAt(10));
  }

  /**
   * Valida CNPJ
   * @param cnpj - CNPJ sem formatação
   */
  private validateCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cnpj.charAt(12))) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;

    return digit2 === parseInt(cnpj.charAt(13));
  }

  /**
   * Validador customizado para CPF/CNPJ
   * @param control - controle do formulário
   */
  documentValidator(control: any): { [key: string]: any } | null {
    const value = control.value?.replace(/\D/g, '') || '';

    if (!value) return null;

    if (value.length !== 11 && value.length !== 14) {
      return { cpf_cnpj: { message: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos' } };
    }

    const isValid = this.validateDocument(value);

    return isValid ? null : { cpf_cnpj: { message: 'Documento inválido' } };
  }
}
